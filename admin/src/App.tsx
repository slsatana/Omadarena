import React from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Refine } from "@refinedev/core";
import { ErrorComponent, ThemedLayoutV2, useNotificationProvider, ThemedSiderV2 } from "@refinedev/antd";
import { ConfigProvider, theme } from "antd";
import routerBindings, { UnsavedChangesNotifier } from "@refinedev/react-router-v6";
import dataProvider from "@refinedev/simple-rest";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import "@refinedev/antd/dist/reset.css";

import { authProvider, axiosInstance } from "./authProvider";
import i18n from "./i18n";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import {
  UsersList, UsersEdit,
  GamesList, GamesEdit,
  VenueNetworksList, VenueNetworksCreate, VenueNetworksEdit,
  PrizesList, PrizesCreate, PrizesEdit,
  TransactionsList, AuditLogsList
} from "./pages/resources";

import { Typography, Card, Row, Col, Statistic } from "antd";
import { UserOutlined, TeamOutlined, PlayCircleOutlined, TrophyOutlined, AppstoreOutlined, WalletOutlined, ShoppingCartOutlined } from "@ant-design/icons";

const DashboardOverview = () => {
  const [stats, setStats] = React.useState<any>({ totalUsers: 0, activeGames: 0, totalPointsAwarded: "0", prizesRedeemed: 0, totalSessions: 0, totalUnspentBalance: "0", activeUsers7dCount: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // @ts-ignore
    const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api/v1`;
    fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
    })
      .then(res => res.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ animation: "fadeIn 0.6s ease" }}>
      <Typography.Title level={2}>{i18n.t("dashboard.title", "Главная панель")}</Typography.Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title={<><UserOutlined /> {i18n.t("dashboard.users", "Всего пользователей")}</>} value={loading ? "..." : stats.totalUsers} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title={<><TeamOutlined /> {i18n.t("dashboard.activeUsers", "Активных игроков (за 7 дней)")}</>} value={loading ? "..." : stats.activeUsers7dCount} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title={<><PlayCircleOutlined /> {i18n.t("dashboard.sessions", "Всего сыграно игр")}</>} value={loading ? "..." : stats.totalSessions} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title={<><AppstoreOutlined /> {i18n.t("dashboard.games", "Активные игры")}</>} value={loading ? "..." : stats.activeGames} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title={<><TrophyOutlined /> {i18n.t("dashboard.points", "Раздано очков")}</>} value={loading ? "..." : stats.totalPointsAwarded} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title={<><WalletOutlined /> {i18n.t("dashboard.unspent", "Непотрачено")}</>} value={loading ? "..." : stats.totalUnspentBalance} valueStyle={{ color: '#34d399' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title={<><ShoppingCartOutlined /> {i18n.t("dashboard.prizes", "Куплено" )}</>} value={loading ? "..." : stats.prizesRedeemed} valueStyle={{ color: '#8b5cf6' }} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Игровая активность (7 дней)">
            <div style={{ width: '100%', height: 300 }}>
              {stats.chartData && stats.chartData.length > 0 ? (
                <ResponsiveContainer>
                  <AreaChart data={stats.chartData.slice().reverse()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: 8, color: '#e4e4e7' }} />
                    <Area type="monotone" dataKey="Игры" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: '#52525b', textAlign: 'center', paddingTop: 100 }}>{loading ? "Загрузка..." : "Нет данных"}</div>
              )}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Покупки призов (7 дней)">
            <div style={{ width: '100%', height: 300 }}>
              {stats.chartData && stats.chartData.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={stats.chartData.slice().reverse()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: 8, color: '#e4e4e7' }} cursor={{ fill: '#27272a' }} />
                    <Bar dataKey="Призы" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: '#52525b', textAlign: 'center', paddingTop: 100 }}>{loading ? "Загрузка..." : "Нет данных"}</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Custom dark theme config
const premiumDarkTheme = {
  token: {
    colorPrimary: "#8b5cf6",
    colorBgBase: "#030305",
    colorTextBase: "#e4e4e7",
  },
  algorithm: theme.darkAlgorithm,
};

// @ts-ignore
const BASE_API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api/v1`;
const API_URL = `${BASE_API_URL}/admin`;
const myDataProvider = dataProvider(API_URL, axiosInstance as any); // using custom axios instance with Bearer token!

const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get('token');
if (tokenFromUrl) {
  localStorage.setItem('admin_token', tokenFromUrl);
  if (window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ConfigProvider theme={premiumDarkTheme}>
        <Refine
          dataProvider={myDataProvider}
          authProvider={authProvider}
          routerProvider={routerBindings}
          // @ts-ignore
          i18nProvider={{ translate: (key: string, params: any) => i18n.t(key, params), changeLocale: (lang: string) => i18n.changeLanguage(lang), getLocale: () => i18n.language }}
          notificationProvider={useNotificationProvider}
          resources={[
            { name: "dashboard", list: "/", meta: { label: "Дашборд" } },
            { name: "users", list: "/users", edit: "/users/edit/:id", meta: { label: "Пользователи" } },
            { name: "games", list: "/games", edit: "/games/edit/:id", meta: { label: "Игры" } },
            { name: "venue_networks", list: "/venue_networks", create: "/venue_networks/create", edit: "/venue_networks/edit/:id", meta: { label: "Заведения" } },
            { name: "prizes", list: "/prizes", create: "/prizes/create", edit: "/prizes/edit/:id", meta: { label: "Призы" } },
            // { name: "promo_codes", list: "/promo_codes", create: "/promo_codes/create", edit: "/promo_codes/edit/:id", meta: { label: "Промокоды" } },
            { name: "wallet_transactions", list: "/wallet_transactions", meta: { label: "Транзакции" } },
            { name: "audit_logs", list: "/audit_logs", meta: { label: "Журнал действий" } },
          ]}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={
              <ThemedLayoutV2
                Title={() => <Typography.Title level={3} style={{color: '#8b5cf6', margin: 0}}>OMAD ARENA</Typography.Title>}
                Sider={() => <ThemedSiderV2 />}
              >
                <Outlet />
              </ThemedLayoutV2>
            }>
              <Route index element={<DashboardOverview />} />
              <Route path="users"><Route index element={<UsersList />} /><Route path="edit/:id" element={<UsersEdit />} /></Route>
              <Route path="games"><Route index element={<GamesList />} /><Route path="edit/:id" element={<GamesEdit />} /></Route>
              
              <Route path="venue_networks">
                <Route index element={<VenueNetworksList />} />
                <Route path="create" element={<VenueNetworksCreate />} />
                <Route path="edit/:id" element={<VenueNetworksEdit />} />
              </Route>
              
              <Route path="prizes">
                <Route index element={<PrizesList />} />
                <Route path="create" element={<PrizesCreate />} />
                <Route path="edit/:id" element={<PrizesEdit />} />
              </Route>
              
              {/* <Route path="promo_codes">
                <Route index element={<PromoCodesList />} />
                <Route path="create" element={<PromoCodesCreate />} />
                <Route path="edit/:id" element={<PromoCodesEdit />} />
              </Route> */}
              
              <Route path="wallet_transactions"><Route index element={<TransactionsList />} /></Route>
              <Route path="audit_logs"><Route index element={<AuditLogsList />} /></Route>
              <Route path="*" element={<ErrorComponent />} />
            </Route>
          </Routes>
          <UnsavedChangesNotifier />
        </Refine>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
