import { Card, Empty, List, Typography, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collectionApi } from '../api/collection';
import { Collection } from '../types/collection';

export function SharedCollection() {
  const { token } = useParams<{ token: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      setLoading(true);
      collectionApi
        .getShared(token)
        .then((data) => {
          setCollection(data);
          setError(null);
        })
        .catch((err) => {
          setError(err?.response?.data?.message || '分享链接无效或已过期');
          setCollection(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token]);

  if (loading) {
    return (
      <main className="page-shell">
        <section className="page-heading">
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        </section>
      </main>
    );
  }

  if (error || !collection) {
    return (
      <main className="page-shell">
        <section className="page-heading">
          <Empty
            description={
              <Typography.Text type="danger">
                {error || '分享链接不存在'}
              </Typography.Text>
            }
          />
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-heading">
        <div>
          <Typography.Text className="eyebrow">Shared Collection</Typography.Text>
          <Typography.Title>{collection.name}</Typography.Title>
          <Typography.Paragraph type="secondary">
            {collection.description || '该收藏夹暂无描述'}
          </Typography.Paragraph>
          {collection.user && (
            <Typography.Paragraph type="secondary">
              分享者：{collection.user.username}
            </Typography.Paragraph>
          )}
          {collection.shared_at && (
            <Typography.Paragraph type="secondary">
              分享时间：{new Date(collection.shared_at).toLocaleString('zh-CN')}
            </Typography.Paragraph>
          )}
        </div>
      </section>
      <section>
        <Card title={`菜谱列表（${collection.recipes.length}）`} className="flat-card">
          {collection.recipes.length === 0 ? (
            <Empty description="该收藏夹暂无菜谱" />
          ) : (
            <List
              dataSource={collection.recipes}
              renderItem={(recipe) => (
                <List.Item>
                  <List.Item.Meta
                    title={recipe.title}
                    description={
                      <div>
                        <Typography.Text type="secondary">
                          {recipe.category} · {recipe.difficulty}
                        </Typography.Text>
                        {recipe.author && (
                          <Typography.Text type="secondary" style={{ marginLeft: 12 }}>
                            作者：{recipe.author.username}
                          </Typography.Text>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </section>
    </main>
  );
}
