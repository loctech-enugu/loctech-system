"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QrCode, RefreshCw, Printer } from "lucide-react";
import type { WalkInSession } from "@/types/walkin-attendance";
import { printWalkInBarcodeSheet } from "./print-walk-in-barcode";

const QR_DISPLAY_SIZE = 200;

export type WalkInBarcodeCardProps = {
  session: WalkInSession | null | undefined;
  loadingSession: boolean;
  isCreatingSession: boolean;
  onCreateSession: () => void;
};

export function WalkInBarcodeCard({
  session,
  loadingSession,
  isCreatingSession,
  onCreateSession,
}: WalkInBarcodeCardProps) {
  const qrUrl = session?.barcode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${QR_DISPLAY_SIZE}x${QR_DISPLAY_SIZE}&data=${encodeURIComponent(session.barcode)}`
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Walk-in Barcode
            </CardTitle>
            <CardDescription>
              Students can scan this QR code to sign in. Creating a new session
              invalidates the previous one.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateSession}
            disabled={isCreatingSession || loadingSession}
          >
            {isCreatingSession ? (
              "Creating..."
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                New Session
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingSession ? (
          <div className="h-52 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : session ? (
          <div className="flex flex-col items-center gap-3">
            {qrUrl && (
              <Image
                src={qrUrl}
                alt="Walk-in QR"
                className="relative rounded-lg border w-52 h-52 object-contain"
                width={QR_DISPLAY_SIZE}
                height={QR_DISPLAY_SIZE}
              />
            )}
            <p className="text-sm font-mono text-muted-foreground break-all max-w-xs text-center">
              {session.barcode}
            </p>
            {session.expiresAt && (
              <p className="text-xs text-muted-foreground">
                Expires {new Date(session.expiresAt).toLocaleString()}
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              className="mt-2"
              onClick={() => printWalkInBarcodeSheet(session)}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print barcode sheet
            </Button>
          </div>
        ) : (
          <div className="h-52 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <p>No active session</p>
            <Button
              size="sm"
              onClick={onCreateSession}
              disabled={isCreatingSession}
            >
              Create Session
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
