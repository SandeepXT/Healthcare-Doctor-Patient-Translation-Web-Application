'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface SummaryData {
  summary: string;
  medicalHighlights: {
    symptoms: string[];
    diagnoses: string[];
    medications: string[];
    followUp: string[];
  };
}

interface SummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: SummaryData | null;
}

export function SummaryDialog({ open, onOpenChange, summary }: SummaryDialogProps) {
  if (!summary) return null;

  const renderList = (items: string[], emptyText: string) => {
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground italic">{emptyText}</p>;
    }
    return (
      <ul className="list-disc list-inside space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-sm">{item}</li>
        ))}
      </ul>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conversation Summary</DialogTitle>
          <DialogDescription>
            AI-generated summary with medical highlights
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{summary.summary}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🤒 Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderList(summary.medicalHighlights.symptoms, 'No symptoms recorded')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🩺 Diagnoses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderList(summary.medicalHighlights.diagnoses, 'No diagnoses recorded')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  💊 Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderList(summary.medicalHighlights.medications, 'No medications prescribed')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  📋 Follow-up Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderList(summary.medicalHighlights.followUp, 'No follow-up actions')}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
