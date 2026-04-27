/** @format */

import {
    CreateAdviceTemplateInput,
    UpdateAdviceTemplateInput,
    CreateDrugTemplateInput,
    UpdateDrugTemplateInput,
    CreateTreatmentTemplateInput,
    UpdateTreatmentTemplateInput,
    CreatePrescriptionTemplateInput,
    UpdatePrescriptionTemplateInput,
} from "./schema";

import { prisma } from "../../lib/prisma";

// ─────────────────────────────────────────────────────────────
// ADVICE TEMPLATE SERVICE
// ─────────────────────────────────────────────────────────────

/**
 * Returns the doctor's own advice templates PLUS all shared templates
 * from any doctor in the system (clinic-wide shared pool).
 */
export const listAdviceTemplates = async (doctorId: string) => {
    return prisma.adviceTemplate.findMany({
        where: {
            OR: [{ doctorId }, { isShared: true }],
        },
        orderBy: { createdAt: "desc" },
    });
};

export const getAdviceTemplateById = async (id: string, doctorId: string) => {
    return prisma.adviceTemplate.findFirst({
        where: {
            id,
            OR: [{ doctorId }, { isShared: true }],
        },
    });
};

export const createAdviceTemplate = async (
    doctorId: string,
    data: CreateAdviceTemplateInput,
) => {
    return prisma.adviceTemplate.create({
        data: { ...data, doctorId },
    });
};

export const updateAdviceTemplate = async (
    id: string,
    doctorId: string,
    data: UpdateAdviceTemplateInput,
) => {
    // Only the owner can update
    const template = await prisma.adviceTemplate.findFirst({
        where: { id, doctorId },
    });
    if (!template) return null;

    return prisma.adviceTemplate.update({
        where: { id },
        data,
    });
};

export const deleteAdviceTemplate = async (id: string, doctorId: string) => {
    const template = await prisma.adviceTemplate.findFirst({
        where: { id, doctorId },
    });
    if (!template) return null;

    return prisma.adviceTemplate.delete({ where: { id } });
};

// ─────────────────────────────────────────────────────────────
// DRUG TEMPLATE SERVICE
// ─────────────────────────────────────────────────────────────

export const listDrugTemplates = async (doctorId: string) => {
    return prisma.drugTemplate.findMany({
        where: {
            OR: [{ doctorId }, { isShared: true }],
        },
        include: {
            items: {
                orderBy: { sortOrder: "asc" },
                include: { drug: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

export const getDrugTemplateById = async (id: string, doctorId: string) => {
    return prisma.drugTemplate.findFirst({
        where: {
            id,
            OR: [{ doctorId }, { isShared: true }],
        },
        include: {
            items: {
                orderBy: { sortOrder: "asc" },
                include: { drug: true },
            },
        },
    });
};

export const createDrugTemplate = async (
    doctorId: string,
    data: CreateDrugTemplateInput,
) => {
    const { items, ...templateData } = data;

    return prisma.drugTemplate.create({
        data: {
            ...templateData,
            doctorId,
            items: {
                create: items.map((item) => ({
                    drugId: item.drugId ?? null,
                    customBrand: item.customBrand ?? null,
                    dose: item.dose ?? null,
                    instruction: item.instruction ?? null,
                    duration: item.duration ?? null,
                    sortOrder: item.sortOrder,
                })),
            },
        },
        include: {
            items: {
                orderBy: { sortOrder: "asc" },
                include: { drug: true },
            },
        },
    });
};

export const updateDrugTemplate = async (
    id: string,
    doctorId: string,
    data: UpdateDrugTemplateInput,
) => {
    const template = await prisma.drugTemplate.findFirst({
        where: { id, doctorId },
    });
    if (!template) return null;

    const { items, ...templateData } = data;

    return prisma.$transaction(async (tx) => {
        if (items !== undefined) {
            // Replace all items atomically
            await tx.drugTemplateItem.deleteMany({ where: { templateId: id } });
            await tx.drugTemplateItem.createMany({
                data: items.map((item) => ({
                    templateId: id,
                    drugId: item.drugId ?? null,
                    customBrand: item.customBrand ?? null,
                    dose: item.dose ?? null,
                    instruction: item.instruction ?? null,
                    duration: item.duration ?? null,
                    sortOrder: item.sortOrder,
                })),
            });
        }

        return tx.drugTemplate.update({
            where: { id },
            data: templateData,
            include: {
                items: {
                    orderBy: { sortOrder: "asc" },
                    include: { drug: true },
                },
            },
        });
    });
};

export const deleteDrugTemplate = async (id: string, doctorId: string) => {
    const template = await prisma.drugTemplate.findFirst({
        where: { id, doctorId },
    });
    if (!template) return null;

    return prisma.drugTemplate.delete({ where: { id } });
};

// ─────────────────────────────────────────────────────────────
// TREATMENT TEMPLATE SERVICE
// ─────────────────────────────────────────────────────────────

export const listTreatmentTemplates = async (doctorId: string) => {
    return prisma.treatmentTemplate.findMany({
        where: {
            OR: [{ doctorId }, { isShared: true }],
        },
        orderBy: { createdAt: "desc" },
    });
};

export const getTreatmentTemplateById = async (
    id: string,
    doctorId: string,
) => {
    return prisma.treatmentTemplate.findFirst({
        where: {
            id,
            OR: [{ doctorId }, { isShared: true }],
        },
    });
};

export const createTreatmentTemplate = async (
    doctorId: string,
    data: CreateTreatmentTemplateInput,
) => {
    return prisma.treatmentTemplate.create({
        data: { ...data, doctorId },
    });
};

export const updateTreatmentTemplate = async (
    id: string,
    doctorId: string,
    data: UpdateTreatmentTemplateInput,
) => {
    const template = await prisma.treatmentTemplate.findFirst({
        where: { id, doctorId },
    });
    if (!template) return null;

    return prisma.treatmentTemplate.update({ where: { id }, data });
};

export const deleteTreatmentTemplate = async (id: string, doctorId: string) => {
    const template = await prisma.treatmentTemplate.findFirst({
        where: { id, doctorId },
    });
    if (!template) return null;

    return prisma.treatmentTemplate.delete({ where: { id } });
};

// ─────────────────────────────────────────────────────────────
// PRESCRIPTION TEMPLATE SERVICE
// ─────────────────────────────────────────────────────────────

export const listPrescriptionTemplates = async (doctorId: string) => {
    return prisma.prescriptionTemplate.findMany({
        where: {
            OR: [{ doctorId }, { isShared: true }],
        },
        include: {
            items: {
                orderBy: { sortOrder: "asc" },
                include: { drug: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

export const getPrescriptionTemplateById = async (
    id: string,
    doctorId: string,
) => {
    return prisma.prescriptionTemplate.findFirst({
        where: {
            id,
            OR: [{ doctorId }, { isShared: true }],
        },
        include: {
            items: {
                orderBy: { sortOrder: "asc" },
                include: { drug: true },
            },
        },
    });
};

export const createPrescriptionTemplate = async (
    doctorId: string,
    data: CreatePrescriptionTemplateInput,
) => {
    const { items, ...templateData } = data;

    return prisma.prescriptionTemplate.create({
        data: {
            ...templateData,
            doctorId,
            items: {
                create: items.map((item) => ({
                    drugId: item.drugId ?? null,
                    diagnosisText: item.diagnosisText ?? null,
                    adviceText: item.adviceText ?? null,
                    customBrand: item.customBrand ?? null,
                    dose: item.dose ?? null,
                    instruction: item.instruction ?? null,
                    duration: item.duration ?? null,
                    sortOrder: item.sortOrder,
                })),
            },
        },
        include: {
            items: {
                orderBy: { sortOrder: "asc" },
                include: { drug: true },
            },
        },
    });
};

export const updatePrescriptionTemplate = async (
    id: string,
    doctorId: string,
    data: UpdatePrescriptionTemplateInput,
) => {
    const template = await prisma.prescriptionTemplate.findFirst({
        where: { id, doctorId },
    });
    if (!template) return null;

    return prisma.prescriptionTemplate.update({
        where: { id },
        data,
        include: {
            items: {
                orderBy: { sortOrder: "asc" },
                include: { drug: true },
            },
        },
    });
};

export const deletePrescriptionTemplate = async (
    id: string,
    doctorId: string,
) => {
    const template = await prisma.prescriptionTemplate.findFirst({
        where: { id, doctorId },
    });
    if (!template) return null;

    return prisma.prescriptionTemplate.delete({ where: { id } });
};
