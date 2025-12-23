import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const GradeTimeline = () => {
  const milestones = [
    { label: "Exam Submitted", status: "complete", date: "Nov 10, 2025", description: "Your encrypted answer has been submitted" },
    { label: "Under Review", status: "active", date: "Nov 12, 2025", description: "Instructors are reviewing submissions" },
    { label: "Grade Released", status: "pending", date: "Nov 15, 2025", description: "Grades will be available for viewing" },
  ];

  return (
    <div className="w-full py-8 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
          Grade Release Timeline
        </h3>
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {milestones.map((milestone, index) => (
            <div key={index} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all ${
                    milestone.status === "complete"
                      ? "bg-secure text-secure-foreground shadow-lock"
                      : milestone.status === "active"
                      ? "bg-secondary text-secondary-foreground animate-pulse"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {milestone.status === "complete" && <CheckCircle2 className="w-6 h-6" />}
                  {milestone.status === "active" && <Clock className="w-6 h-6" />}
                  {milestone.status === "pending" && <AlertCircle className="w-6 h-6" />}
                </div>
                <p className="text-sm font-medium text-foreground text-center mb-1">
                  {milestone.label}
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  {milestone.date}
                </p>
              </div>
              {index < milestones.length - 1 && (
                <div
                  className={`absolute top-6 left-1/2 w-full h-0.5 ${
                    milestone.status === "complete"
                      ? "bg-secure"
                      : "bg-border"
                  }`}
                  style={{ transform: "translateY(-50%)" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
