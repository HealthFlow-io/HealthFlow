'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { medicalRecordService } from '@/services/medical-record.service';
import { fileService } from '@/services/file.service';
import { MedicalRecord } from '@/types';

interface UploadedFile {
  file: File;
  description: string;
  attachmentType: 'Scan' | 'LabResult' | 'Prescription' | 'Xray' | 'Other';
}

interface FormData {
  diagnosis: string;
  symptoms: string;
  treatment: string;
  prescription: string;
  notes: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
  followUpDate: string;
}

export default function EditMedicalRecordPage() {
  const { patientId, recordId } = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [formData, setFormData] = useState<FormData>({
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescription: '',
    notes: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    followUpDate: ''
  });

  const [newFiles, setNewFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recordId) {
      loadRecord();
    }
  }, [recordId]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const data = await medicalRecordService.getById(recordId as string);
      setRecord(data);
      
      // Populate form data
      setFormData({
        diagnosis: data.diagnosis || '',
        symptoms: data.symptoms || '',
        treatment: data.treatment || '',
        prescription: data.prescription || '',
        notes: data.notes || '',
        bloodPressureSystolic: data.vitalSigns?.bloodPressureSystolic?.toString() || '',
        bloodPressureDiastolic: data.vitalSigns?.bloodPressureDiastolic?.toString() || '',
        heartRate: data.vitalSigns?.heartRate?.toString() || '',
        temperature: data.vitalSigns?.temperature?.toString() || '',
        weight: data.vitalSigns?.weight?.toString() || '',
        height: data.vitalSigns?.height?.toString() || '',
        followUpDate: data.followUpDate
          ? new Date(data.followUpDate).toISOString().slice(0, 16)
          : ''
      });
    } catch (err) {
      console.error('Error loading medical record:', err);
      setError('Failed to load medical record');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    
    setNewFiles((prev) => [
      ...prev,
      {
        file,
        description: file.name,
        attachmentType: 'Other'
      }
    ]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateFileDescription = (index: number, description: string) => {
    setNewFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, description } : f))
    );
  };

  const updateFileType = (
    index: number,
    attachmentType: UploadedFile['attachmentType']
  ) => {
    setNewFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, attachmentType } : f))
    );
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to remove this attachment?')) {
      return;
    }

    try {
      await medicalRecordService.removeAttachment(attachmentId);
      // Reload record to get updated attachments
      await loadRecord();
    } catch (err) {
      console.error('Error removing attachment:', err);
      setError('Failed to remove attachment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.diagnosis?.trim()) {
      setError('Diagnosis is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Build the update DTO with proper structure
      const updateDto = {
        diagnosis: formData.diagnosis || undefined,
        symptoms: formData.symptoms || undefined,
        treatment: formData.treatment || undefined,
        prescription: formData.prescription || undefined,
        notes: formData.notes || undefined,
        vitalSigns: {
          bloodPressureSystolic: formData.bloodPressureSystolic ? parseFloat(formData.bloodPressureSystolic) : undefined,
          bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseFloat(formData.bloodPressureDiastolic) : undefined,
          heartRate: formData.heartRate ? parseFloat(formData.heartRate) : undefined,
          temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          height: formData.height ? parseFloat(formData.height) : undefined
        },
        followUpDate: formData.followUpDate || undefined
      };

      // Update the medical record
      await medicalRecordService.update(recordId as string, updateDto);

      // Upload new files and add attachments
      for (const fileItem of newFiles) {
        try {
          setUploadingFile(true);
          
          const uploadResponse = await fileService.upload(fileItem.file);
          
          await medicalRecordService.addAttachment(recordId as string, {
            fileUploadId: uploadResponse.id,
            description: fileItem.description,
            attachmentType: fileItem.attachmentType
          });
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
        }
      }

      router.push(`/doctor/patients/${patientId}/records/${recordId}`);
    } catch (err: unknown) {
      console.error('Error updating medical record:', err);
      setError('Failed to update medical record. Please try again.');
    } finally {
      setSaving(false);
      setUploadingFile(false);
    }
  };

  const attachmentTypes: UploadedFile['attachmentType'][] = [
    'Scan',
    'LabResult',
    'Prescription',
    'Xray',
    'Other'
  ];

  const getAttachmentTypeIcon = (type: string) => {
    switch (type) {
      case 'Scan': return '🔬';
      case 'LabResult': return '🧪';
      case 'Prescription': return '💊';
      case 'Xray': return '🩻';
      default: return '📎';
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

  if (error && !record) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <span className="text-4xl">⚠️</span>
              <h2 className="mt-4 text-lg font-semibold text-destructive">{error}</h2>
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
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/doctor/patients/${patientId}/records/${recordId}`)}
        >
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Medical Record</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Diagnosis & Symptoms */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Diagnosis & Symptoms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Diagnosis <span className="text-destructive">*</span>
              </label>
              <Input
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                placeholder="Enter diagnosis"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Symptoms</label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                placeholder="Describe patient symptoms"
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {/* Treatment & Prescription */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Treatment & Prescription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Treatment</label>
              <textarea
                name="treatment"
                value={formData.treatment}
                onChange={handleInputChange}
                placeholder="Describe treatment plan"
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Prescription</label>
              <textarea
                name="prescription"
                value={formData.prescription}
                onChange={handleInputChange}
                placeholder="List prescribed medications"
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vital Signs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Vital Signs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">BP Systolic</label>
                <Input
                  type="number"
                  name="bloodPressureSystolic"
                  value={formData.bloodPressureSystolic}
                  onChange={handleInputChange}
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">BP Diastolic</label>
                <Input
                  type="number"
                  name="bloodPressureDiastolic"
                  value={formData.bloodPressureDiastolic}
                  onChange={handleInputChange}
                  placeholder="80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Heart Rate (bpm)</label>
                <Input
                  type="number"
                  name="heartRate"
                  value={formData.heartRate}
                  onChange={handleInputChange}
                  placeholder="72"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Temperature (°C)</label>
                <Input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  placeholder="36.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Height (cm)</label>
                <Input
                  type="number"
                  step="0.1"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  placeholder="175"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes & Follow-up */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes"
                className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Follow-up Date</label>
              <Input
                type="datetime-local"
                name="followUpDate"
                value={formData.followUpDate || ''}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Existing Attachments */}
        {record?.attachments && record.attachments.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Existing Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {record.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-4 border rounded-lg"
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
                    <div className="flex gap-2">
                      <a
                        href={fileService.getFileUrl(attachment.fileUploadId)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeExistingAttachment(attachment.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* New Attachments */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                + Add Attachment
              </Button>
            </div>

            {newFiles.length > 0 && (
              <div className="space-y-3">
                {newFiles.map((fileItem, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row gap-3 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">{fileItem.file.name}</p>
                      <Input
                        value={fileItem.description}
                        onChange={(e) => updateFileDescription(index, e.target.value)}
                        placeholder="Description"
                        className="mb-2"
                      />
                      <div className="flex flex-wrap gap-2">
                        {attachmentTypes.map((type) => (
                          <Badge
                            key={type}
                            variant={fileItem.attachmentType === type ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => updateFileType(index, type)}
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeNewFile(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/doctor/patients/${patientId}/records/${recordId}`)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? uploadingFile
                ? 'Uploading files...'
                : 'Saving...'
              : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
