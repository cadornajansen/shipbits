"use client"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DistributionError({ reset }: { reset: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Distribution channels could not be loaded</AlertTitle>
      <AlertDescription>
        Check database connectivity and confirm the distribution migration has
        been applied.
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  )
}
