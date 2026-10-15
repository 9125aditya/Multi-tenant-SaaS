import { Outlet, Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/login" className="flex items-center justify-center gap-2 text-indigo-600">
          <Layers className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight text-slate-900">SaaS Portal</span>
        </Link>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xs rounded-xl border border-slate-200 sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}