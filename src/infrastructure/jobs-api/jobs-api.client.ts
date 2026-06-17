import { Injectable, InternalServerErrorException } from "@nestjs/common";

export type ColegioJobsStats = {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  processingJobs: number;
};

@Injectable()
export class JobsApiClient {
  async getColegioStats(colegioId: string): Promise<ColegioJobsStats> {
    const baseUrl = process.env.DOCS_SERVICE_URL;
    if (!baseUrl) {
      throw new InternalServerErrorException("DOCS_SERVICE_URL is required.");
    }

    const response = await fetch(`${baseUrl}/api/jobs/colegio/${colegioId}/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Error fetching colegio stats from jobs service: ${response.statusText}`,
      );
    }

    return (await response.json()) as ColegioJobsStats;
  }
}
