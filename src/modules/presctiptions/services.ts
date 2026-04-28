/** @format */

import { PrescriptionStatus, Role } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import {
    CreatePrescriptionInput,
    UpdatePrescriptionInput,
    ChiefComplaintInput,
    UpdateChiefComplaintInput,
    HistoryInput,
    ExaminationInput,
    UpdateExaminationInput,
    DiagnosisInput,
    UpdateDiagnosisInput,
    InvestigationInput,
    UpdateInvestigationInput,
    RxItemInput,
    UpdateRxItemInput,
    AdviceInput,
    UpdateAdviceInput,
    ReportEntryInput,
    UpdateReportEntryInput,
    BmiRecordInput,
    DrugHistoryInput,
    UpdateDrugHistoryInput,
    PlanInput,
    UpdatePlanInput,
    NoteInput,
    UpdateNoteInput,
} from "./schema";

// ─── Shared Full Include ──────────────────────────────────────────────────────

const prescriptionFullInclude = {
    chiefComplaints: { orderBy: { sortOrder: "asc" as const } },
    history: true,
    examinations: { orderBy: { sortOrder: "asc" as const } },
    diagnoses: { orderBy: { sortOrder: "asc" as const } },
    investigations: { orderBy: { sortOrder: "asc" as const } },
    rxItems: { orderBy: { sortOrder: "asc" as const } },
    advices: { orderBy: { sortOrder: "asc" as const } },
    reportEntries: true,
    bmiRecord: true,
    drugHistories: { orderBy: { sortOrder: "asc" as const } },
    plans: { orderBy: { sortOrder: "asc" as const } },
    notes: { orderBy: { sortOrder: "asc" as const } },
    appointment: {
        select: {
            id: true,
            appointmentDate: true,
            serviceType: true,
            fee: true,
            // ✅ pull doctor + patient through appointment relation
            doctor: {
                select: {
                    id: true,
                    name: true,
                    doctorProfile: {
                        select: {
                            specialty: true,
                            qualifications: true,
                            licenseNo: true,
                            signatureImageUrl: true,
                            clinicName: true,
                            clinicAddress: true,
                        },
                    },
                },
            },
            patient: {
                select: {
                    id: true,
                    name: true,
                    patientProfile: {
                        select: {
                            regNo: true,
                            dateOfBirth: true,
                            sex: true,
                            bloodGroup: true,
                            weightKg: true,
                            heightCm: true,
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.PrescriptionInclude;

// ─── Internal Helpers ─────────────────────────────────────────────────────────

// Verify prescription exists and return it
const getPrescriptionOrThrow = async (prescriptionId: string) => {
    const rx = await prisma.prescription.findUnique({
        where: { id: prescriptionId },
        select: { id: true, doctorId: true, status: true },
    });
    if (!rx) throw new Error("PRESCRIPTION_NOT_FOUND");
    return rx;
};

// Only doctor who owns it or admin can mutate. Also blocks edits on FINALIZED/PRINTED.
const assertCanEdit = (
    rx: { doctorId: string; status: PrescriptionStatus },
    requesterId: string,
    requesterRole: Role,
) => {
    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );
    if (!isAdmin && rx.doctorId !== requesterId) throw new Error("FORBIDDEN");
    if (rx.status === PrescriptionStatus.FINALIZED)
        throw new Error("PRESCRIPTION_FINALIZED");
    if (rx.status === PrescriptionStatus.PRINTED)
        throw new Error("PRESCRIPTION_PRINTED");
};

// const assertCanEdit = async (
//     rx: { doctorId: string; status: PrescriptionStatus },
//     requesterId: string,
//     requesterRole: Role,
// ) => {
//     const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
//         requesterRole,
//     );

//     if (!isAdmin) {
//         const isDoctor = rx.doctorId === requesterId;

//         // ✅ check if requester is an assistant linked to this doctor
//         const isAssistant =
//             requesterRole === Role.DOCTOR_ASSISTANT &&
//             (await prisma.user
//                 .findFirst({
//                     where: {
//                         id: requesterId,
//                         assistantId: rx.doctorId, // linked to the prescription's doctor
//                     },
//                     select: { id: true },
//                 })
//                 .then(Boolean));

//         if (!isDoctor && !isAssistant) throw new Error("FORBIDDEN");
//     }

//     if (rx.status === PrescriptionStatus.FINALIZED)
//         throw new Error("PRESCRIPTION_FINALIZED");
//     if (rx.status === PrescriptionStatus.PRINTED)
//         throw new Error("PRESCRIPTION_PRINTED");
// };
// Generic BMI calculation
const calcBmi = (
    weightKg: number,
    heightFeet: number,
    heightInches: number,
) => {
    const totalInches = heightFeet * 12 + heightInches;
    const heightM = totalInches * 0.0254;
    if (heightM <= 0) return null;
    const bmi = weightKg / (heightM * heightM);
    let bmiClass = "Underweight";
    if (bmi >= 30) bmiClass = "Obese";
    else if (bmi >= 25) bmiClass = "Overweight";
    else if (bmi >= 18.5) bmiClass = "Normal";
    return { bmiValue: parseFloat(bmi.toFixed(1)), bmiClass };
};

// ══════════════════════════════════════════════════════════════════════════════
// PRESCRIPTION ROOT
// ══════════════════════════════════════════════════════════════════════════════

export const createPrescriptionService = async (
    data: CreatePrescriptionInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const { appointmentId, headerTemplate, clinicalNotes } = data;

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { id: true, doctorId: true, patientId: true, status: true },
    });

    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");

    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );
    if (!isAdmin && appointment.doctorId !== requesterId)
        throw new Error("FORBIDDEN");

    // One prescription per appointment
    const existing = await prisma.prescription.findUnique({
        where: { appointmentId },
        select: { id: true },
    });
    if (existing) throw new Error("PRESCRIPTION_ALREADY_EXISTS");

    return prisma.prescription.create({
        data: {
            appointmentId,
            doctorId: appointment.doctorId,
            patientId: appointment.patientId,
            status: PrescriptionStatus.DRAFT,
            headerTemplate: headerTemplate ?? null,
            clinicalNotes: clinicalNotes ?? null,
        },
        include: prescriptionFullInclude,
    });
};

export const getPrescriptionByIdService = async (
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await prisma.prescription.findUnique({
        where: { id },
        include: prescriptionFullInclude,
    });

    if (!rx) throw new Error("PRESCRIPTION_NOT_FOUND");

    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );
    const isOwner = rx.doctorId === requesterId || rx.patientId === requesterId;
    const isAssist = requesterRole === Role.DOCTOR_ASSISTANT;

    if (!isAdmin && !isOwner && !isAssist) throw new Error("FORBIDDEN");

    return rx;
};

export const updatePrescriptionService = async (
    id: string,
    data: UpdatePrescriptionInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(id);
    assertCanEdit(rx, requesterId, requesterRole);

    return prisma.prescription.update({
        where: { id },
        data,
        include: prescriptionFullInclude,
    });
};

export const printPrescriptionService = async (
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(id);

    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(
        requesterRole,
    );
    if (!isAdmin && rx.doctorId !== requesterId) throw new Error("FORBIDDEN");

    if (rx.status === PrescriptionStatus.DRAFT)
        throw new Error("PRESCRIPTION_NOT_FINALIZED");

    return prisma.prescription.update({
        where: { id },
        data: { status: PrescriptionStatus.PRINTED },
        include: prescriptionFullInclude,
    });
};

// ══════════════════════════════════════════════════════════════════════════════
// CHIEF COMPLAINTS
// ══════════════════════════════════════════════════════════════════════════════

export const listChiefComplaintsService = async (prescriptionId: string) => {
    await getPrescriptionOrThrow(prescriptionId);
    return prisma.chiefComplaint.findMany({
        where: { prescriptionId },
        orderBy: { sortOrder: "asc" },
    });
};

export const addChiefComplaintService = async (
    prescriptionId: string,
    data: ChiefComplaintInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    return prisma.chiefComplaint.create({ data: { prescriptionId, ...data } });
};

export const updateChiefComplaintService = async (
    prescriptionId: string,
    id: string,
    data: UpdateChiefComplaintInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.chiefComplaint.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    return prisma.chiefComplaint.update({ where: { id }, data });
};

export const deleteChiefComplaintService = async (
    prescriptionId: string,
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.chiefComplaint.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    await prisma.chiefComplaint.delete({ where: { id } });
    return { message: "Chief complaint removed." };
};

// ══════════════════════════════════════════════════════════════════════════════
// HISTORY (upsert)
// ══════════════════════════════════════════════════════════════════════════════

export const getHistoryService = async (prescriptionId: string) => {
    await getPrescriptionOrThrow(prescriptionId);
    const history = await prisma.history.findUnique({
        where: { prescriptionId },
    });
    if (!history) throw new Error("ITEM_NOT_FOUND");
    return history;
};

export const upsertHistoryService = async (
    prescriptionId: string,
    data: HistoryInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    return prisma.history.upsert({
        where: { prescriptionId },
        create: { prescriptionId, ...data },
        update: data,
    });
};

// ══════════════════════════════════════════════════════════════════════════════
// EXAMINATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const listExaminationsService = async (prescriptionId: string) => {
    await getPrescriptionOrThrow(prescriptionId);
    return prisma.examination.findMany({
        where: { prescriptionId },
        orderBy: { sortOrder: "asc" },
    });
};

export const addExaminationService = async (
    prescriptionId: string,
    data: ExaminationInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    return prisma.examination.create({ data: { prescriptionId, ...data } });
};

export const updateExaminationService = async (
    prescriptionId: string,
    id: string,
    data: UpdateExaminationInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.examination.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    return prisma.examination.update({ where: { id }, data });
};

export const deleteExaminationService = async (
    prescriptionId: string,
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.examination.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    await prisma.examination.delete({ where: { id } });
    return { message: "Examination removed." };
};

// ══════════════════════════════════════════════════════════════════════════════
// DIAGNOSES
// ══════════════════════════════════════════════════════════════════════════════

export const listDiagnosesService = async (prescriptionId: string) => {
    await getPrescriptionOrThrow(prescriptionId);
    return prisma.diagnosis.findMany({
        where: { prescriptionId },
        orderBy: { sortOrder: "asc" },
    });
};

export const addDiagnosisService = async (
    prescriptionId: string,
    data: DiagnosisInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    return prisma.diagnosis.create({ data: { prescriptionId, ...data } });
};

export const updateDiagnosisService = async (
    prescriptionId: string,
    id: string,
    data: UpdateDiagnosisInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.diagnosis.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    return prisma.diagnosis.update({ where: { id }, data });
};

export const deleteDiagnosisService = async (
    prescriptionId: string,
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.diagnosis.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    await prisma.diagnosis.delete({ where: { id } });
    return { message: "Diagnosis removed." };
};

// ══════════════════════════════════════════════════════════════════════════════
// INVESTIGATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const listInvestigationsService = async (prescriptionId: string) => {
    await getPrescriptionOrThrow(prescriptionId);
    return prisma.investigation.findMany({
        where: { prescriptionId },
        orderBy: { sortOrder: "asc" },
    });
};

export const addInvestigationService = async (
    prescriptionId: string,
    data: InvestigationInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    return prisma.investigation.create({ data: { prescriptionId, ...data } });
};

export const updateInvestigationService = async (
    prescriptionId: string,
    id: string,
    data: UpdateInvestigationInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.investigation.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    return prisma.investigation.update({ where: { id }, data });
};

export const deleteInvestigationService = async (
    prescriptionId: string,
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.investigation.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    await prisma.investigation.delete({ where: { id } });
    return { message: "Investigation removed." };
};

// ══════════════════════════════════════════════════════════════════════════════
// RX ITEMS
// ══════════════════════════════════════════════════════════════════════════════

export const listRxItemsService = async (prescriptionId: string) => {
    await getPrescriptionOrThrow(prescriptionId);
    return prisma.rxItem.findMany({
        where: { prescriptionId },
        orderBy: { sortOrder: "asc" },
    });
};

export const addRxItemService = async (
    prescriptionId: string,
    data: RxItemInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    return prisma.rxItem.create({ data: { prescriptionId, ...data } });
};

export const updateRxItemService = async (
    prescriptionId: string,
    id: string,
    data: UpdateRxItemInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.rxItem.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    return prisma.rxItem.update({ where: { id }, data });
};

export const deleteRxItemService = async (
    prescriptionId: string,
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.rxItem.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    await prisma.rxItem.delete({ where: { id } });
    return { message: "Rx item removed." };
};

// ══════════════════════════════════════════════════════════════════════════════
// ADVICE
// ══════════════════════════════════════════════════════════════════════════════

export const listAdviceService = async (prescriptionId: string) => {
    await getPrescriptionOrThrow(prescriptionId);
    return prisma.prescriptionAdvice.findMany({
        where: { prescriptionId },
        orderBy: { sortOrder: "asc" },
    });
};

export const addAdviceService = async (
    prescriptionId: string,
    data: AdviceInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    return prisma.prescriptionAdvice.create({
        data: { prescriptionId, ...data },
    });
};

export const updateAdviceService = async (
    prescriptionId: string,
    id: string,
    data: UpdateAdviceInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.prescriptionAdvice.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    return prisma.prescriptionAdvice.update({ where: { id }, data });
};

export const deleteAdviceService = async (
    prescriptionId: string,
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.prescriptionAdvice.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    await prisma.prescriptionAdvice.delete({ where: { id } });
    return { message: "Advice removed." };
};

// ══════════════════════════════════════════════════════════════════════════════
// REPORT ENTRIES
// ══════════════════════════════════════════════════════════════════════════════

export const listReportEntriesService = async (prescriptionId: string) => {
    await getPrescriptionOrThrow(prescriptionId);
    return prisma.reportEntry.findMany({
        where: { prescriptionId },
        orderBy: { reportDate: "desc" },
    });
};

export const addReportEntryService = async (
    prescriptionId: string,
    data: ReportEntryInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    return prisma.reportEntry.create({ data: { prescriptionId, ...data } });
};

export const updateReportEntryService = async (
    prescriptionId: string,
    id: string,
    data: UpdateReportEntryInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.reportEntry.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    return prisma.reportEntry.update({ where: { id }, data });
};

export const deleteReportEntryService = async (
    prescriptionId: string,
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.reportEntry.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    await prisma.reportEntry.delete({ where: { id } });
    return { message: "Report entry removed." };
};

// ══════════════════════════════════════════════════════════════════════════════
// BMI RECORD (upsert — one per prescription)
// ══════════════════════════════════════════════════════════════════════════════

export const getBmiRecordService = async (prescriptionId: string) => {
    await getPrescriptionOrThrow(prescriptionId);
    const record = await prisma.bmiRecord.findUnique({
        where: { prescriptionId },
    });
    if (!record) throw new Error("ITEM_NOT_FOUND");
    return record;
};

export const upsertBmiRecordService = async (
    prescriptionId: string,
    data: BmiRecordInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);

    let bmiValue: number | null = null;
    let bmiClass: string | null = null;
    let idealWeightKg: number | null = null;

    if (
        data.weightKg &&
        data.heightFeet !== undefined &&
        data.heightFeet !== null &&
        data.heightInches !== undefined &&
        data.heightInches !== null
    ) {
        const result = calcBmi(
            data.weightKg,
            data.heightFeet,
            data.heightInches,
        );
        if (result) {
            bmiValue = result.bmiValue;
            bmiClass = result.bmiClass;
            // Devine formula ideal body weight (simplified)
            const totalInches = data.heightFeet * 12 + data.heightInches;
            idealWeightKg = parseFloat(
                (50 + 2.3 * (totalInches - 60)).toFixed(1),
            );
        }
    }

    return prisma.bmiRecord.upsert({
        where: { prescriptionId },
        create: { prescriptionId, ...data, bmiValue, bmiClass, idealWeightKg },
        update: { ...data, bmiValue, bmiClass, idealWeightKg },
    });
};

// ══════════════════════════════════════════════════════════════════════════════
// DRUG HISTORY
// ══════════════════════════════════════════════════════════════════════════════

export const listDrugHistoryService = async (prescriptionId: string) => {
    await getPrescriptionOrThrow(prescriptionId);
    return prisma.drugHistory.findMany({
        where: { prescriptionId },
        orderBy: { sortOrder: "asc" },
    });
};

export const addDrugHistoryService = async (
    prescriptionId: string,
    data: DrugHistoryInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    return prisma.drugHistory.create({ data: { prescriptionId, ...data } });
};

export const updateDrugHistoryService = async (
    prescriptionId: string,
    id: string,
    data: UpdateDrugHistoryInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.drugHistory.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    return prisma.drugHistory.update({ where: { id }, data });
};

export const deleteDrugHistoryService = async (
    prescriptionId: string,
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.drugHistory.findFirst({
        where: { id, prescriptionId },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    await prisma.drugHistory.delete({ where: { id } });
    return { message: "Drug history entry removed." };
};

// ══════════════════════════════════════════════════════════════════════════════
// PLANS
// ══════════════════════════════════════════════════════════════════════════════

export const listPlansService = async (prescriptionId: string) => {
    await getPrescriptionOrThrow(prescriptionId);
    return prisma.plan.findMany({
        where: { prescriptionId },
        orderBy: { sortOrder: "asc" },
    });
};

export const addPlanService = async (
    prescriptionId: string,
    data: PlanInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    return prisma.plan.create({ data: { prescriptionId, ...data } });
};

export const updatePlanService = async (
    prescriptionId: string,
    id: string,
    data: UpdatePlanInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.plan.findFirst({ where: { id, prescriptionId } });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    return prisma.plan.update({ where: { id }, data });
};

export const deletePlanService = async (
    prescriptionId: string,
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.plan.findFirst({ where: { id, prescriptionId } });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    await prisma.plan.delete({ where: { id } });
    return { message: "Plan removed." };
};

// ══════════════════════════════════════════════════════════════════════════════
// NOTES
// ══════════════════════════════════════════════════════════════════════════════

export const listNotesService = async (prescriptionId: string) => {
    await getPrescriptionOrThrow(prescriptionId);
    return prisma.note.findMany({
        where: { prescriptionId },
        orderBy: { sortOrder: "asc" },
    });
};

export const addNoteService = async (
    prescriptionId: string,
    data: NoteInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    return prisma.note.create({ data: { prescriptionId, ...data } });
};

export const updateNoteService = async (
    prescriptionId: string,
    id: string,
    data: UpdateNoteInput,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.note.findFirst({ where: { id, prescriptionId } });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    return prisma.note.update({ where: { id }, data });
};

export const deleteNoteService = async (
    prescriptionId: string,
    id: string,
    requesterId: string,
    requesterRole: Role,
) => {
    const rx = await getPrescriptionOrThrow(prescriptionId);
    assertCanEdit(rx, requesterId, requesterRole);
    const item = await prisma.note.findFirst({ where: { id, prescriptionId } });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    await prisma.note.delete({ where: { id } });
    return { message: "Note removed." };
};
