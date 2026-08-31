"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  jobStatuses,
  statusLabels,
} from "@/features/directory-submissions/config"
import { updateDirectoryJobAction } from "@/features/directory-submissions/actions"
import type { DirectoryJob } from "@/features/directory-submissions/types"
import { AdminActionForm } from "./admin-action-form"

export function ManageSubmissionDialog({ job }: { job: DirectoryJob }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Manage</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage submission</DialogTitle>
          <DialogDescription>{job.directories.name}</DialogDescription>
        </DialogHeader>
        <div className="text-xs text-muted-foreground">
          Account: {job.directories.requires_account === null
            ? "check requirements"
            : job.directories.requires_account
              ? "required"
              : "not required"} · Fee: {job.directories.requires_payment === null
            ? "check current fees"
            : job.directories.requires_payment
              ? "required"
              : "not required"}. Use Needs action for fees, identity checks,
          CAPTCHA, or founder-only access. Do not bypass restrictions.
        </div>
        <a
          href={job.directories.submission_url || job.directories.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-sm text-teal-700 underline underline-offset-4"
        >
          Open directory ↗
        </a>
        <AdminActionForm action={updateDirectoryJobAction} label="Save changes">
          <input type="hidden" name="id" value={job.id} />
          <label className="grid gap-1 text-sm">
            Status
            <select
              name="status"
              defaultValue={job.status}
              className="h-9 rounded-md border bg-background px-3"
            >
              {jobStatuses.map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Public result URL
            <Input name="result_url" type="url" defaultValue={job.result_url ?? ""} maxLength={2000} />
          </label>
          <label className="grid gap-1 text-sm">
            Rejection reason
            <Textarea name="rejection_reason" defaultValue={job.rejection_reason ?? ""} maxLength={2000} />
          </label>
          <label className="grid gap-1 text-sm">
            Founder action message
            <Textarea name="action_required_message" defaultValue={job.action_required_message ?? ""} maxLength={2000} />
          </label>
          <label className="grid gap-1 text-sm">
            Private admin notes
            <Textarea name="admin_notes" defaultValue={job.admin_notes ?? ""} maxLength={5000} />
          </label>
        </AdminActionForm>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
