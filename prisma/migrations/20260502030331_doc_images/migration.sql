-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "followUpFee" DECIMAL(65,30),
ADD COLUMN     "profileImageUrl" TEXT;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
