"use client";

import { Card } from "@/components/ui/card";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ExamList = () => {
  return (
    <Card className="p-8 bg-gradient-card border-border/50 shadow-float">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary/10 rounded-lg">
            <FileText className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">My Submissions</h2>
            <p className="text-sm text-muted-foreground">
              View and decrypt your exam submissions
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Exam
        </Button>
      </div>

      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No submissions yet. Submit your first exam to see it here.
        </p>
      </div>
    </Card>
  );
};
