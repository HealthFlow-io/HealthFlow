export { authService } from './auth.service';
export { doctorService } from './doctor.service';
export { appointmentService } from './appointment.service';
export { specializationService } from './specialization.service';
export { clinicService } from './clinic.service';
export { notificationService } from './notification.service';
export { adminService } from './admin.service';
export { medicalRecordService } from './medical-record.service';
export { fileService } from './file.service';
export { secretaryService } from './secretary.service';
export type { SecretaryPatient, SecretaryProfile } from './secretary.service';
export type { 
  CreateUserRequest,
  UpdateUserRequest,
  CreateDoctorRequest,
  UpdateDoctorRequest,
  CreateClinicRequest,
  UpdateClinicRequest,
  GeoLocationDto,
  WorkingHoursDto,
  ContactInfoDto,
  CreateSpecializationRequest,
  CreateSecretaryRequest,
  AssignDoctorRequest,
  AdminStats 
} from './admin.service';
