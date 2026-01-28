'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { medicalRecordService } from '@/services/medical-record.service';
import { fileService } from '@/services/file.service';
import { MedicalRecord } from '@/types';

export default function MedicalRecordDetailsPage() {
  const { patientId, recordId } = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (recordId) {
      loadRecord();
    }
  }, [recordId]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const response = await medicalRecordService.getById(recordId as string);
      setRecord(response);
    } catch (err) {
      console.error('Error loading medical record:', err);
      setError('Failed to load medical record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this medical record? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await medicalRecordService.delete(recordId as string);
      router.push(`/doctor/patients/${patientId}`);
    } catch (err) {
      console.error('Error deleting medical record:', err);
      setError('Failed to delete medical record');
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAttachmentTypeIcon = (type: string) => {
    switch (type) {
      case 'Scan':
        return '🔬';
      case 'LabResult':
        return '🧪';
      case 'Prescription':
        return '💊';
      case 'Xray':
        return '🩻';
      default:
        return '📎';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <span className="text-4xl">⚠️</span>
              <h2 className="mt-4 text-lg font-semibold text-destructive">
                {error || 'Record not found'}
              </h2>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/doctor/patients/${patientId}`)}
              >
                Back to Patient
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/doctor/patients/${patientId}`)}
          >
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Medical Record</h1>
            <p className="text-muted-foreground">{formatDate(record.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/doctor/patients/${patientId}/records/${recordId}/edit`}>
            <Button variant="outline">Edit Record</Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Diagnosis & Symptoms */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Diagnosis & Symptoms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Diagnosis</p>
            <p className="font-medium text-lg">{record.diagnosis || 'Not recorded'}</p>
          </div>
          {record.symptoms && (
            <div>
              <p className="text-sm text-muted-foreground">Symptoms</p>
              <p className="whitespace-pre-wrap">{record.symptoms}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treatment & Prescription */}
      {(record.treatment || record.prescription) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Treatment & Prescription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {record.treatment && (
              <div>
                <p className="text-sm text-muted-foreground">Treatment</p>
                <p className="whitespace-pre-wrap">{record.treatment}</p>
              </div>
            )}
            {record.prescription && (
              <div>
                <p className="text-sm text-muted-foreground">Prescription</p>
                <p className="whitespace-pre-wrap">{record.prescription}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vital Signs */}
      {record.vitalSigns && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Vital Signs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(record.vitalSigns.bloodPressureSystolic || record.vitalSigns.bloodPressureDiastolic) && (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Blood Pressure</p>
                  <p className="font-semibold">{record.vitalSigns.bloodPressureSystolic || '-'}/{record.vitalSigns.bloodPressureDiastolic || '-'}</p>
                </div>
              )}
              {record.vitalSigns.heartRate && (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Heart Rate</p>
                  <p className="font-semibold">{record.vitalSigns.heartRate} bpm</p>
                </div>
              )}
              {record.vitalSigns.temperature && (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="font-semibold">{record.vitalSigns.temperature}°C</p>
                </div>
              )}
              {record.vitalSigns.weight && (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-semibold">{record.vitalSigns.weight} kg</p>
                </div>
              )}
              {record.vitalSigns.height && (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="font-semibold">{record.vitalSigns.height} cm</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes & Follow-up */}
      {(record.notes || record.followUpDate) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {record.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="whitespace-pre-wrap">{record.notes}</p>
              </div>
            )}
            {record.followUpDate && (
              <div>
                <p className="text-sm text-muted-foreground">Follow-up Date</p>
                <Badge variant="outline" className="mt-1">
                  {formatDate(record.followUpDate)}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {record.attachments && record.attachments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Attachments ({record.attachments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {record.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-2xl">
                    {getAttachmentTypeIcon(attachment.attachmentType)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {attachment.description || 'Attachment'}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {attachment.attachmentType}
                    </Badge>
                  </div>
                  <a
                    href={fileService.getFileUrl(attachment.fileUploadId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div>
              <span>Created: </span>
              <span className="text-foreground">{formatDate(record.createdAt)}</span>
            </div>
            {record.updatedAt && record.updatedAt !== record.createdAt && (
              <div>
                <span>Last Updated: </span>
                <span className="text-foreground">{formatDate(record.updatedAt)}</span>
              </div>
            )}
            {record.doctor && (
              <div>
                <span>Doctor: </span>
                <span className="text-foreground">
                  Dr. {record.doctor.firstName} {record.doctor.lastName}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
