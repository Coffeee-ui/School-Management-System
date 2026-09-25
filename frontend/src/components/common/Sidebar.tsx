import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import {
  User,
  BookOpen,
  Calendar,
  Award,
  Users,
  Briefcase,
  Shield,
  FileText,
  UserCheck,
  Layers,
  LayoutDashboard,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const getNavItems = () => {
    switch (role) {
      case 'student':
        return [
          { id: 'profile', label: 'Student Profile', icon: User },
          { id: 'courses', label: 'Enrolled Courses', icon: BookOpen },
          { id: 'schedules', label: 'Class Schedules', icon: Calendar },
          { id: 'grades', label: 'Grades & GWA', icon: Award },
        ];

      case 'employee':
        return [
          { id: 'profile', label: 'Employee Profile', icon: User },
          { id: 'schedules', label: 'Assigned Schedule', icon: Calendar },
          { id: 'courses', label: 'Course Catalog', icon: BookOpen },
        ];

      case 'hr':
        return [
          { id: 'employees', label: 'Employee Records', icon: Users },
          { id: 'schedules', label: 'Duty Scheduling', icon: Calendar },
          { id: 'profile', label: 'My Profile', icon: User },
        ];

      case 'registrar':
        return [
          { id: 'students', label: 'Student Directory', icon: UserCheck },
          { id: 'courses', label: 'Course Catalog', icon: BookOpen },
          { id: 'schedules', label: 'Academic Schedules', icon: Calendar },
          { id: 'enrollments', label: 'Enrollments', icon: Layers },
          { id: 'grades', label: 'Grade Encoding', icon: Award },
          { id: 'employees', label: 'Faculty & Staff', icon: Users },
        ];

      case 'admin':
        return [
          { id: 'overview', label: 'System Overview', icon: LayoutDashboard },
          { id: 'users', label: 'User Accounts', icon: Shield },
          { id: 'audit_logs', label: 'Audit Logs', icon: FileText },
          { id: 'students', label: 'Student Management', icon: UserCheck },
          { id: 'employees', label: 'Employee Management', icon: Users },
          { id: 'courses', label: 'Course Catalog', icon: BookOpen },
          { id: 'schedules', label: 'All Schedules', icon: Calendar },
          { id: 'enrollments', label: 'Enrollment Records', icon: Layers },
          { id: 'grades', label: 'Grade Management', icon: Award },
        ];

      default:
        return [];
    }
  };

  const getSectionTitle = () => {
    switch (role) {
      case 'student':   return 'Student Portal';
      case 'employee':  return 'Faculty & Staff';
      case 'hr':        return 'HR Operations';
      case 'registrar': return 'Registrar Office';
      case 'admin':     return 'System Control';
      default:          return 'Navigation';
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section-title">{getSectionTitle()}</div>
      <nav className="sidebar-nav" role="navigation" aria-label="Main menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={18} className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
