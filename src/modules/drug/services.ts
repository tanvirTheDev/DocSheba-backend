/** @format */

import { Role } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import {
    SearchDrugsInput,
    CreateDrugInput,
    UpdateDrugInput,
    CreateDrugTemplateInput,
    UpdateDrugTemplateInput,
} from "./schema";

// ─── Shared Selects ───────────────────────────────────────────────────────────

const drugSelect = {
    id: true,
    brandName: true,
    genericName: true,
    drugClass: true,
    strength: true,
    form: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.DrugDatabaseSelect;

const templateItemSelect = {
    id: true,
    templateId: true,
    drugId: true,
    customBrand: true,
    dose: true,
    instruction: true,
    duration: true,
    sortOrder: true,
    drug: {
        select: {
            id: true,
            brandName: true,
            genericName: true,
            strength: true,
            form: true,
        },
    },
} satisfies Prisma.DrugTemplateItemSelect;

const templateSelect = {
    id: true,
    doctorId: true,
    templateName: true,
    isShared: true,
    createdAt: true,
    updatedAt: true,
    items: {
        select: templateItemSelect,
        orderBy: { sortOrder: "asc" as const },
    },
} satisfies Prisma.DrugTemplateSelect;

// ══════════════════════════════════════════════════════════════════════════════
// DRUG CATALOGUE
// ══════════════════════════════════════════════════════════════════════════════

export const searchDrugsService = async (filters: SearchDrugsInput) => {
    const { page, limit, search, form } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.DrugDatabaseWhereInput = {
        isActive: true,
        ...(form && { form }),
        ...(search && {
            OR: [
                { brandName: { contains: search, mode: "insensitive" } },
                { genericName: { contains: search, mode: "insensitive" } },
                { drugClass: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [drugs, total] = await Promise.all([
        prisma.drugDatabase.findMany({
            where,
            skip,
            take: limit,
            orderBy: { brandName: "asc" },
            select: drugSelect,
        }),
        prisma.drugDatabase.count({ where }),
    ]);

    return {
        drugs,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
        },
    };
};

export const getDrugByIdService = async (id: string) => {
    const drug = await prisma.drugDatabase.findUnique({
        where: { id },
        select: drugSelect,
    });

    if (!drug) throw new Error("DRUG_NOT_FOUND");
    return drug;
};

export const createDrugService = async (data: CreateDrugInput) => {
    const conflict = await prisma.drugDatabase.findFirst({
        where: {
            brandName: { equals: data.brandName, mode: "insensitive" },
            // ✅ null → undefined so Prisma's where filter is satisfied
            strength: data.strength ?? undefined,
            form: data.form ?? undefined,
        },
        select: { id: true },
    });

    if (conflict) throw new Error("DRUG_ALREADY_EXISTS");

    return prisma.drugDatabase.create({
        data: {
            brandName: data.brandName,
            genericName: data.genericName ?? null,
            drugClass: data.drugClass ?? null,
            strength: data.strength ?? null,
            form: data.form ?? undefined,
            isActive: data.isActive ?? true,
        },
        select: drugSelect,
    });
};

export const updateDrugService = async (id: string, data: UpdateDrugInput) => {
    const existing = await prisma.drugDatabase.findUnique({
        where: { id },
        select: { id: true },
    });
    if (!existing) return null;

    return prisma.drugDatabase.update({
        where: { id },
        data: {
            ...(data.brandName !== undefined && { brandName: data.brandName }),
            ...(data.genericName !== undefined && {
                genericName: data.genericName ?? null,
            }),
            ...(data.drugClass !== undefined && {
                drugClass: data.drugClass ?? null,
            }),
            ...(data.strength !== undefined && {
                strength: data.strength ?? null,
            }),
            ...(data.form !== undefined && { form: data.form ?? undefined }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        select: drugSelect,
    });
};

export const deactivateDrugService = async (id: string) => {
    const drug = await prisma.drugDatabase.findUnique({
        where: { id },
        select: { id: true, isActive: true },
    });

    if (!drug) throw new Error("DRUG_NOT_FOUND");
    if (!drug.isActive) throw new Error("DRUG_ALREADY_INACTIVE");

    await prisma.drugDatabase.update({
        where: { id },
        data: { isActive: false },
    });

    return { message: "Drug deactivated successfully." };
};

// ══════════════════════════════════════════════════════════════════════════════
// DRUG TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════

export const listDrugTemplatesService = async (
    requesterId: string,
    requesterRole: Role,
) => {
    // Doctors see their own templates + shared ones
    // Admins see all
    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );

    const where: Prisma.DrugTemplateWhereInput = isAdmin
        ? {}
        : { OR: [{ doctorId: requesterId }, { isShared: true }] };

    return prisma.drugTemplate.findMany({
        where,
        orderBy: [{ isShared: "desc" }, { templateName: "asc" }],
        select: templateSelect,
    });
};

export const createDrugTemplateService = async (
    data: CreateDrugTemplateInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const { templateName, isShared, items } = data;

    // Only doctors can create templates
    if (
        requesterRole !== Role.DOCTOR &&
        requesterRole !== Role.ADMIN &&
        requesterRole !== Role.SUPER_ADMIN
    )
        throw new Error("FORBIDDEN");

    // Validate all drugIds exist if provided
    const drugIds = items
        .filter((i) => i.drugId)
        .map((i) => i.drugId as string);
    if (drugIds.length > 0) {
        const drugs = await prisma.drugDatabase.findMany({
            where: { id: { in: drugIds }, isActive: true },
            select: { id: true },
        });
        if (drugs.length !== drugIds.length) throw new Error("DRUG_NOT_FOUND");
    }

    return prisma.drugTemplate.create({
        data: {
            doctorId: requesterId,
            templateName,
            isShared: isShared ?? false,
            items: {
                create: items.map((item) => ({
                    drugId: item.drugId ?? null,
                    customBrand: item.customBrand ?? null,
                    dose: item.dose ?? null,
                    instruction: item.instruction ?? null,
                    duration: item.duration ?? null,
                    sortOrder: item.sortOrder ?? 0,
                })),
            },
        },
        select: templateSelect,
    });
};

export const updateDrugTemplateService = async (
    id: string,
    data: UpdateDrugTemplateInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const template = await prisma.drugTemplate.findUnique({
        where: { id },
        select: { id: true, doctorId: true },
    });

    if (!template) throw new Error("TEMPLATE_NOT_FOUND");

    // Only owner or admin can update
    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );
    if (!isAdmin && template.doctorId !== requesterId)
        throw new Error("FORBIDDEN");

    const { items, ...rest } = data;

    // If items provided — replace all items (delete + recreate)
    if (items && items.length > 0) {
        const drugIds = items
            .filter((i) => i.drugId)
            .map((i) => i.drugId as string);
        if (drugIds.length > 0) {
            const drugs = await prisma.drugDatabase.findMany({
                where: { id: { in: drugIds }, isActive: true },
                select: { id: true },
            });
            if (drugs.length !== drugIds.length)
                throw new Error("DRUG_NOT_FOUND");
        }

        await prisma.$transaction([
            prisma.drugTemplateItem.deleteMany({ where: { templateId: id } }),
            prisma.drugTemplate.update({
                where: { id },
                data: {
                    ...rest,
                    items: {
                        create: items.map((item) => ({
                            drugId: item.drugId ?? null,
                            customBrand: item.customBrand ?? null,
                            dose: item.dose ?? null,
                            instruction: item.instruction ?? null,
                            duration: item.duration ?? null,
                            sortOrder: item.sortOrder ?? 0,
                        })),
                    },
                },
            }),
        ]);
    } else {
        await prisma.drugTemplate.update({
            where: { id },
            data: rest,
        });
    }

    return prisma.drugTemplate.findUnique({
        where: { id },
        select: templateSelect,
    });
};

export const deleteDrugTemplateService = async (
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const template = await prisma.drugTemplate.findUnique({
        where: { id },
        select: { id: true, doctorId: true },
    });

    if (!template) throw new Error("TEMPLATE_NOT_FOUND");

    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );
    if (!isAdmin && template.doctorId !== requesterId)
        throw new Error("FORBIDDEN");

    await prisma.drugTemplate.delete({ where: { id } });

    return { message: "Drug template deleted successfully." };
};
