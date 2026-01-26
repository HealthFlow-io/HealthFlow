User

- Id
- first Name
- last Name
- Email
- PasswordHash
- Role : [Admin, Doctor, Secretary, Patient, ClinicManager]
- Phone

secretary profile

- Id
- UserId
- doctors []

Doctor

- Id
- UserId
- fullName
- SpecializationId
- subSpecializations[]
- Bio
- ExperienceYears
- languages[]
- consultationTypes: [online, physical, home-visit]
- consultationDuration
- ConsultationPrice
- clinicId
- rating

Specialization

- Id
- Name (Cardiology, Dermatology, Dentist...)
- category (Medical, Surgical, Mental Health...)
- Description

DoctorAvailability

- Id
- DoctorId
- DayOfWeek
- StartTime
- EndTime

Appointment

- Id
- PatientId
- DoctorId
- clinicId
- date
- StartTime
- EndTime
- type (ONLINE | PHYSICAL)
- Status (Pending, Approved, Declined, Cancelled, Done)
- MeetingLink
- reason
- createdAt
- approvedBy

MedicalRecord

- Id
- PatientId
- DoctorId
- Notes
- PrescriptionUrl

Clinic:

- id
- name
- address
- geoLocation
- workingHours
- contactInfo
