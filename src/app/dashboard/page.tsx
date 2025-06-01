'use client';

import AppLayout from "@/components/AppLayout";
import DashboardComponent from "@/components/Dashboard/DashboardComponent";
import { Suspense } from 'react';

export const dynamic = 'force-dynamic'; // Force dynamic rendering

const Dashboard = () => {
  return (
    // Wrap the layout/component using useSearchParams in Suspense
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <AppLayout title="Dashboard">
        <DashboardComponent />
      </AppLayout>
    </Suspense>
  );
};

export default Dashboard;

