# Seeded Database Information

## ✅ Database Successfully Seeded

Your database has been populated with realistic test data generated using the Bogus library.

## 📊 Data Summary

Based on the seeder configuration:

- **Users**: 273 (1 admin, 2 secretaries, 20 secretaries, 50 doctors, 200 patients)
- **Clinics**: 15
- **Specializations**: 10 (from migration)
- **Doctors**: 50 with profiles
- **Doctor Availability**: ~400+ time slots
- **Appointments**: 500 (mix of pending, approved, completed, cancelled)
- **Medical Records**: ~98 (for completed appointments)
- **File Uploads**: 100
- **Medical Record Attachments**: Links to ~40% of medical records
- **Doctor Ratings**: 150
- **Notifications**: 300

## 🔐 Default Login Credentials

**All users have the same default password: `password`**

### Sample Login Credentials by Role

#### Admin
- **Email**: Any admin user email from the seeded data
- **Password**: `password`

#### Doctors
- **Email**: Any doctor user email (first 50 users)
- **Password**: `password`

#### Patients
- **Email**: Any patient user email
- **Password**: `password`

#### Secretaries
- **Email**: Any secretary user email
- **Password**: `password`

## 🎯 Testing Recommendations

1. **Login Testing**: Use any generated email with password `password`
2. **Appointments**: Test with 500 appointments across different statuses
3. **Medical Records**: View ~98 medical records with realistic data
4. **Doctor Ratings**: Check doctors with 150 ratings (3-5 stars)
5. **Performance**: Evaluate pagination, search, and filtering with large datasets
6. **Notifications**: Test with 300 notifications across users

## 🗄️ Database Details

- **Database Name**: healthflow_db
- **Data Consistency**: All data uses consistent seed (12345) for reproducibility
- **Relationships**: All foreign keys properly linked
- **Realistic Data**: Generated using Faker patterns for names, addresses, phone numbers, etc.

## 🔄 Reseeding Database

If you need to reseed with fresh data:

```bash
cd Back/HealthFlow_backend/HealthFlow_backend
dotnet ef database drop --force
dotnet ef database update
dotnet run seed
```

## 📝 Notes

- Medical records are created for approximately 60% of completed appointments
- File uploads are simulated (not actual files on disk)
- Doctor ratings are between 3-5 stars for realistic distribution
- Appointments span across different dates and times
- All emails follow realistic patterns (e.g., firstname.lastname@example.com)

## 🚀 Next Steps

1. Start the backend: `dotnet run`
2. Start the frontend: `npm run dev`
3. Login with any seeded user (password: `password`)
4. Explore the application with comprehensive test data
