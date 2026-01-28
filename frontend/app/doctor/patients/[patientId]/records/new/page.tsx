'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { medicalRecordService } from '@/services/medical-record.service';
import { fileService } from '@/services/file.service';

interface UploadedFile {
  file: File;
  description: string;
  attachmentType: 'Scan' | 'LabResult' | 'Prescription' | 'Xray' | 'Other';
  uploadedId?: number;
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

export default function NewMedicalRecordPage() {
  const { patientId } = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    
    // Add file to list with default values
    setFiles((prev) => [
      ...prev,
      {
        file,
        description: file.name,
        attachmentType: 'Other'
      }
    ]);


    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateFileDescription = (index: number, description: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, description } : f))
    );
  };

  const updateFileType = (
    index: number,
    attachmentType: UploadedFile['attachmentType']
  ) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, attachmentType } : f))
    );
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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

      // Build the create DTO with proper structure
      const createDto = {
        patientId: patientId as string,
        diagnosis: formData.diagnosis || undefined,
        symptoms: formData.symptoms || undefined,
        treatment: formData.treatment || undefined,
        prescription: formData.prescription || undefined,
        notes: formData.notes || '',
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

      // Create the medical record
      const recordResponse = await medicalRecordService.create(createDto);
      const recordId = recordResponse.id;

      // Upload files and add attachments
      for (const fileItem of files) {
        try {
          setUploadingFile(true);
          
          // Upload the file
          const uploadResponse = await fileService.upload(fileItem.file);
          
          // Add attachment to medical record
          await medicalRecordService.addAttachment(recordId, {
            fileUploadId: uploadResponse.id,
            description: fileItem.description,
            attachmentType: fileItem.attachmentType
          });
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          // Continue with other files even if one fails
        }
      }

      // Navigate back to patient details
      router.push(`/doctor/patients/${patientId}`);
    } catch (err: unknown) {
      console.error('Error creating medical record:', err);
      setError('Failed to create medical record. Please try again.');
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/doctor/patients/${patientId}`)}
        >
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">New Medical Record</h1>
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
                <label className="block text-sm font-medium mb-2">
                  BP Systolic
                </label>
                <Input
                  type="number"
                  name="bloodPressureSystolic"
                  value={formData.bloodPressureSystolic}
                  onChange={handleInputChange}
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  BP Diastolic
                </label>
                <Input
                  type="number"
                  name="bloodPressureDiastolic"
                  value={formData.bloodPressureDiastolic}
                  onChange={handleInputChange}
                  placeholder="80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Heart Rate (bpm)
                </label>
                <Input
                  type="number"
                  name="heartRate"
                  value={formData.heartRate}
                  onChange={handleInputChange}
                  placeholder="72"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Temperature (°C)
                </label>
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
              <label className="block text-sm font-medium mb-2">
                Follow-up Date
              </label>
              <Input
                type="datetime-local"
                name="followUpDate"
                value={formData.followUpDate || ''}
                onChange={handleInputChange}
                className="[&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* File Attachments */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
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

            {files.length > 0 && (
              <div className="space-y-3">
                {files.map((fileItem, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row gap-3 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">{fileItem.file.name}</p>
                      <Input
                        value={fileItem.description}
                        onChange={(e) =>
                          updateFileDescription(index, e.target.value)
                        }
                        placeholder="Description"
                        className="mb-2"
                      />
                      <div className="flex flex-wrap gap-2">
                        {attachmentTypes.map((type) => (
                          <Badge
                            key={type}
                            variant={
                              fileItem.attachmentType === type
                                ? 'default'
                                : 'outline'
                            }
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
                      onClick={() => removeFile(index)}
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
            onClick={() => router.push(`/doctor/patients/${patientId}`)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? uploadingFile
                ? 'Uploading files...'
                : 'Saving...'
              : 'Save Medical Record'}
          </Button>
        </div>
      </form>
    </div>
  );
}
