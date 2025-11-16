// yellow-diamond-learn-dev/src/pages/admin/RegionAdmins.tsx
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RegionAdminManager from "@/components/admin/RegionAdminManager";

const RegionAdminsPage = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <RegionAdminManager />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegionAdminsPage;