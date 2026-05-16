import { Typography } from 'antd';
import { ReactNode } from 'react';

type PageHeaderProps = {
  kicker: string;
  title: string;
  description: string;
  extra?: ReactNode;
};

export function PageHeader({ kicker, title, description, extra }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <div className="page-kicker">{kicker}</div>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ maxWidth: 760, margin: '8px 0 0' }}>
          {description}
        </Typography.Paragraph>
      </div>
      {extra}
    </div>
  );
}
