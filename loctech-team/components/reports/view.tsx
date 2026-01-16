import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DailyReport } from "@/types";

interface EditReportDialogProps {
  report: DailyReport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewReport({
  report,
  open,
  onOpenChange,
}: EditReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Daily Report</DialogTitle>
          <DialogDescription>
            Submitted by {report.user.name} ({report.user.role}) on{" "}
            {new Date(report.date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Report Title */}
          <div className="grid gap-2">
            <Label>Title</Label>
            <p className="text-sm text-muted-foreground">{report.title}</p>
          </div>

          {/* Summary */}
          {report.summary && (
            <div className="grid gap-2">
              <Label>Summary</Label>
              <p className="text-sm text-muted-foreground">{report.summary}</p>
            </div>
          )}

          {/* Tasks Completed */}
          {report.tasksCompleted && report.tasksCompleted.length > 0 && (
            <div className="grid gap-2">
              <Label>Tasks Completed</Label>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {report.tasksCompleted.map((task, idx) => (
                  <li key={idx}>{task}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Blockers */}
          {report.blockers && (
            <div className="grid gap-2">
              <Label>Blockers</Label>
              <p className="text-sm text-muted-foreground">{report.blockers}</p>
            </div>
          )}

          {/* Plan for Tomorrow */}
          {report.planForTomorrow && (
            <div className="grid gap-2">
              <Label>Plan for Tomorrow</Label>
              <p className="text-sm text-muted-foreground">
                {report.planForTomorrow}
              </p>
            </div>
          )}

          {/* Status */}
          <div className="grid gap-2">
            <Label>Status</Label>
            <p
              className={`text-sm font-medium ${
                report.status === "approved"
                  ? "text-green-600"
                  : report.status === "rejected"
                    ? "text-red-600"
                    : report.status === "submitted"
                      ? "text-blue-600"
                      : "text-gray-600"
              }`}
            >
              {report.status.toUpperCase()}
            </p>
          </div>

          {/* Late flag */}
          {report.isLate && (
            <p className="text-xs text-red-500 font-medium">
              ⚠ This report was submitted late
            </p>
          )}

          {/* Review info */}
          {report.reviewedBy && (
            <div className="grid gap-2">
              <Label>Reviewed By</Label>
              <p className="text-sm text-muted-foreground">
                {report.reviewedBy}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
