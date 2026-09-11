import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Megaphone, PhoneCall, Plug } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Overview", url: "/operator", icon: LayoutDashboard },
  { title: "Leads / Deals", url: "/operator/leads", icon: Users },
  { title: "Marketing", url: "/operator/marketing", icon: Megaphone },
  { title: "Voice", url: "/operator/voice", icon: PhoneCall },
  { title: "Integrations", url: "/operator/integrations", icon: Plug },
];

const OperatorSidebar: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ClearFund Operator</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <NavLink to={item.url} end className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default OperatorSidebar;
