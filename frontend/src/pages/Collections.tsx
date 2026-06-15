import { DeleteOutlined, FolderAddOutlined, ShareAltOutlined, StopOutlined, CopyOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, List, Popconfirm, Switch, Typography, message, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { collectionApi, CollectionPayload } from '../api/collection';
import { useCollectionStore } from '../stores/useCollectionStore';
import { Collection } from '../types/collection';

export function Collections() {
  const [form] = Form.useForm<CollectionPayload>();
  const { collections, fetchCollections } = useCollectionStore();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);

  useEffect(() => {
    void fetchCollections();
  }, [fetchCollections]);

  const createCollection = async (values: CollectionPayload) => {
    await collectionApi.create(values);
    form.resetFields();
    await fetchCollections();
    message.success('收藏夹已创建');
  };

  const removeCollection = async (id: number) => {
    await collectionApi.remove(id);
    await fetchCollections();
    message.success('收藏夹已删除');
  };

  const removeRecipe = async (collectionId: number, recipeId: number) => {
    await collectionApi.removeRecipe(collectionId, recipeId);
    await fetchCollections();
    message.success('已移出菜谱');
  };

  const handleShare = async (collection: Collection) => {
    const updated = await collectionApi.share(collection.id);
    setCurrentCollection(updated);
    setShareModalOpen(true);
    await fetchCollections();
    message.success('已生成分享链接');
  };

  const handleUnshare = async (id: number) => {
    await collectionApi.unshare(id);
    setShareModalOpen(false);
    setCurrentCollection(null);
    await fetchCollections();
    message.success('已停用分享');
  };

  const copyShareLink = () => {
    if (currentCollection?.share_token) {
      const link = `${window.location.origin}/share/${currentCollection.share_token}`;
      navigator.clipboard.writeText(link).then(() => {
        message.success('分享链接已复制');
      }).catch(() => {
        message.error('复制失败，请手动复制');
      });
    }
  };

  return (
    <main className="page-shell">
      <section className="page-heading">
        <div>
          <Typography.Title>收藏夹</Typography.Title>
          <Typography.Paragraph type="secondary">按主题整理可复做、可公开分享的菜谱集合。</Typography.Paragraph>
        </div>
      </section>
      <section className="split-layout">
        <Card title="新建收藏夹" className="flat-card">
          <Form form={form} layout="vertical" onFinish={createCollection}>
            <Form.Item name="name" label="名称" rules={[{ required: true, max: 50 }]}>
              <Input />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={3} maxLength={200} />
            </Form.Item>
            <Form.Item name="is_public" label="公开" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<FolderAddOutlined />}>
              创建
            </Button>
          </Form>
        </Card>
        <div className="collection-stack">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className="flat-card"
              title={`${collection.name}${collection.is_public ? ' · 公开' : ''}`}
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  {collection.share_token ? (
                    <>
                      <Button
                        type="primary"
                        icon={<ShareAltOutlined />}
                        onClick={() => {
                          setCurrentCollection(collection);
                          setShareModalOpen(true);
                        }}
                      >
                        分享链接
                      </Button>
                      <Popconfirm title="确定停用分享？" onConfirm={() => void handleUnshare(collection.id)}>
                        <Button icon={<StopOutlined />} danger>
                          停用
                        </Button>
                      </Popconfirm>
                    </>
                  ) : (
                    <Button
                      type="primary"
                      icon={<ShareAltOutlined />}
                      onClick={() => void handleShare(collection)}
                    >
                      生成分享
                    </Button>
                  )}
                  <Popconfirm title="删除收藏夹？" onConfirm={() => void removeCollection(collection.id)}>
                    <Button icon={<DeleteOutlined />} danger />
                  </Popconfirm>
                </div>
              }
            >
              <Typography.Paragraph type="secondary">
                {collection.description || '未填写描述'}
              </Typography.Paragraph>
              <List
                dataSource={collection.recipes}
                renderItem={(recipe) => (
                  <List.Item
                    actions={[
                      <Button
                        key="remove"
                        size="small"
                        onClick={() => void removeRecipe(collection.id, recipe.id)}
                      >
                        移出
                      </Button>,
                    ]}
                  >
                    {recipe.title} · {recipe.category}
                  </List.Item>
                )}
              />
            </Card>
          ))}
        </div>
      </section>
      <Modal
        title="分享收藏夹"
        open={shareModalOpen}
        onCancel={() => setShareModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setShareModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {currentCollection && (
          <div style={{ padding: '12px 0' }}>
            <Typography.Paragraph>
              将以下链接分享给他人，对方无需登录即可查看收藏夹内容：
            </Typography.Paragraph>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Input
                value={`${window.location.origin}/share/${currentCollection.share_token}`}
                readOnly
              />
              <Button icon={<CopyOutlined />} onClick={copyShareLink}>
                复制
              </Button>
            </div>
            {currentCollection.shared_at && (
              <Typography.Paragraph type="secondary">
                分享时间：{new Date(currentCollection.shared_at).toLocaleString('zh-CN')}
              </Typography.Paragraph>
            )}
            <Popconfirm
              title="确定停用分享？"
              description="停用后，分享链接将失效，他人将无法访问。"
              onConfirm={() => void handleUnshare(currentCollection.id)}
            >
              <Button danger icon={<StopOutlined />}>
                停用分享
              </Button>
            </Popconfirm>
          </div>
        )}
      </Modal>
    </main>
  );
}
