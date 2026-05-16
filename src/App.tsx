import { useState } from 'react';
import type { ReactNode } from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  AppstoreOutlined,
  ExperimentOutlined,
  FireOutlined,
  GiftOutlined,
  SkinOutlined,
  ThunderboltOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import { BattlePage } from './presentation/pages/BattlePage';
import { CharactersPage } from './presentation/pages/CharactersPage';
import { DashboardPage } from './presentation/pages/DashboardPage';
import { FormationPage } from './presentation/pages/FormationPage';
import { FortuneFestivalPage } from './presentation/pages/FortuneFestivalPage';
import { InventoryPage } from './presentation/pages/InventoryPage';
import { SummonPage } from './presentation/pages/SummonPage';

const { Sider, Content } = Layout;

type PageKey = 'dashboard' | 'characters' | 'formation' | 'battle' | 'summon' | 'festival' | 'inventory';

const pages: Record<PageKey, ReactNode> = {
  dashboard: <DashboardPage />,
  characters: <CharactersPage />,
  formation: <FormationPage />,
  battle: <BattlePage />,
  summon: <SummonPage />,
  festival: <FortuneFestivalPage />,
  inventory: <InventoryPage />
};

export function App() {
  const [page, setPage] = useState<PageKey>('dashboard');

  return (
    <Layout className="app-shell">
      <Sider breakpoint="lg" collapsedWidth="0" className="app-sider" width={270}>
        <div className="brand-panel">
          <div className="brand-mark">HT</div>
          <div>
            <Typography.Title level={4} className="brand-title">
              Heroes Tactics Arena
            </Typography.Title>
            <Typography.Text className="brand-subtitle">RPG tático offline-first</Typography.Text>
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[page]}
          onClick={({ key }) => setPage(key as PageKey)}
          items={[
            { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
            { key: 'characters', icon: <FireOutlined />, label: 'Personagens' },
            { key: 'formation', icon: <UsergroupAddOutlined />, label: 'Formação' },
            { key: 'battle', icon: <ThunderboltOutlined />, label: 'Batalha' },
            { key: 'summon', icon: <ExperimentOutlined />, label: 'Invocação' },
            { key: 'festival', icon: <GiftOutlined />, label: 'Festival da Fortuna' },
            { key: 'inventory', icon: <SkinOutlined />, label: 'Inventário' }
          ]}
        />
      </Sider>
      <Layout>
        <Content className="app-content">{pages[page]}</Content>
      </Layout>
    </Layout>
  );
}
