'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { useAuthStore } from '@/store';
import { medicalRecordService } from '@/services';
import { MedicalRecord } from '@/types';

export default function PatientMedicalRecordsPage() {
  const user = useAuthStore((state) => state.user);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadMedicalRecords();
    }
  }, [user?.id]);

  const loadMedicalRecords = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await medicalRecordService.getByPatient(user!.id);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load medical records:', err);
      setError('Failed to load medical records');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl block mb-4">❌</span>
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadMedicalRecords}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Medical Records</h2>
        <p className="text-muted-foreground">View your complete medical history</p>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <span className="text-6xl block mb-4">📋</span>
            <h3 className="text-xl font-semibold mb-2">No Medical Records</h3>
            <p className="text-muted-foreground">
              Your medical records will appear here after your appointments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Records List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-lg">All Records ({records.length})</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {records.map((record) => (
                <Card
                  key={record.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedRecord?.id === record.id
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                  onClick={() => setSelectedRecord(record)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {record.diagnosis || 'General Consultation'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Dr. {record.doctor?.firstName} {record.doctor?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.doctor?.specializationName}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(record.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Record Details */}
          <div className="lg:col-span-2">
            {selectedRecord ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Medical Record Details</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {formatDate(selectedRecord.createdAt)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Doctor Info */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Attending Physician</h4>
                    <p className="text-lg">
                      Dr. {selectedRecord.doctor?.firstName} {selectedRecord.doctor?.lastName}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedRecord.doctor?.specializationName}
                    </p>
                  </div>

                  {/* Diagnosis */}
                  {selectedRecord.diagnosis && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span>🩺</span> Diagnosis
                      </h4>
                      <p className="text-muted-foreground">{selectedRecord.diagnosis}</p>
                    </div>
                  )}

                  {/* Symptoms */}
                  {selectedRecord.symptoms && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span>📝</span> Symptoms
                      </h4>
                      <p className="text-muted-foreground">{selectedRecord.symptoms}</p>
                    </div>
                  )}

                  {/* Treatment */}
                  {selectedRecord.treatment && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span>💊</span> Treatment
                      </h4>
                      <p className="text-muted-foreground">{selectedRecord.treatment}</p>
                    </div>
                  )}

                  {/* Prescription */}
                  {selectedRecord.prescription && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span>📋</span> Prescription
                      </h4>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {selectedRecord.prescription}
                      </p>
                    </div>
                  )}

                  {/* Vital Signs */}
                  {selectedRecord.vitalSigns && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span>❤️</span> Vital Signs
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(selectedRecord.vitalSigns.bloodPressureSystolic || selectedRecord.vitalSigns.bloodPressureDiastolic) && (
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Blood Pressure</p>
                            <p className="font-semibold">
                              {selectedRecord.vitalSigns.bloodPressureSystolic || '--'}/{selectedRecord.vitalSigns.bloodPressureDiastolic || '--'} mmHg
                            </p>
                          </div>
                        )}
                        {selectedRecord.vitalSigns.heartRate && (
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Heart Rate</p>
                            <p className="font-semibold">{selectedRecord.vitalSigns.heartRate} bpm</p>
                          </div>
                        )}
                        {selectedRecord.vitalSigns.temperature && (
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Temperature</p>
                            <p className="font-semibold">{selectedRecord.vitalSigns.temperature}°C</p>
                          </div>
                        )}
                        {selectedRecord.vitalSigns.weight && (
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Weight</p>
                            <p className="font-semibold">{selectedRecord.vitalSigns.weight} kg</p>
                          </div>
                        )}
                        {selectedRecord.vitalSigns.height && (
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Height</p>
                            <p className="font-semibold">{selectedRecord.vitalSigns.height} cm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedRecord.notes && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span>📒</span> Notes
                      </h4>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {selectedRecord.notes}
                      </p>
                    </div>
                  )}

                  {/* Follow-up */}
                  {selectedRecord.followUpDate && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span>📅</span> Follow-up Appointment
                      </h4>
                      <p className="font-medium">{formatDate(selectedRecord.followUpDate)}</p>
                      {selectedRecord.followUpNotes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedRecord.followUpNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Attachments */}
                  {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span>📎</span> Attachments
                      </h4>
                      <div className="space-y-2">
                        {selectedRecord.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{attachment.fileName}</p>
                              <p className="text-sm text-muted-foreground">
                                {attachment.attachmentType}
                                {attachment.description && ` - ${attachment.description}`}
                              </p>
                            </div>
                            <a
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <span className="text-6xl block mb-4">👆</span>
                  <h3 className="text-xl font-semibold mb-2">Select a Record</h3>
                  <p className="text-muted-foreground">
                    Click on a medical record from the list to view its details.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
