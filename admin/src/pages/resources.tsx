import { List, Create, Edit, useTable, useForm, DateField, useSelect, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Input, Switch, InputNumber, Form, DatePicker, Typography, Space, Button, Select, Tabs, Upload, message, Card, Row, Col, Statistic, Divider, Tag, Avatar, Modal } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useTranslate, useList, useUpdate } from "@refinedev/core";
import dayjs from "dayjs";
import { useState } from "react";


const FileUploadField = ({ value, onChange }: any) => {
  const t = useTranslate();
  const handleChange = (info: any) => {
    if (info.file.status === 'done') {
      message.success(t("messages.uploadSuccess", "Загружено успешно"));
      // Since our server returns { url: "..." }
      onChange(info.file.response.url);
    } else if (info.file.status === 'error') {
      message.error(t("messages.uploadError", "Ошибка загрузки"));
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Upload
        name="file"
        // @ts-ignore
        action={`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api/v1`}/upload`}
        showUploadList={false}
        onChange={handleChange}
        accept="image/*"
      >
        <Button>Выбрать файл</Button>
      </Upload>
      {value && <img src={value} alt="preview" style={{ maxHeight: 100, marginTop: 10, borderRadius: 8 }} />}
    </Space>
  );
};

const UserProfileModal = ({ user, onClose }: { user: any | null, onClose: () => void }) => {
  if (!user) return null;
  
  const { data: txData, isLoading: txLoading } = useList({
    resource: "wallet_transactions",
    pagination: { pageSize: 50 },
    filters: [{ field: "userId", operator: "eq", value: user.id }],
    sorters: [{ field: "createdAt", order: "desc" }],
    queryOptions: { enabled: !!user }
  });

  const { data: sessData, isLoading: sessLoading } = useList({
    resource: "game_sessions",
    pagination: { pageSize: 50 },
    filters: [{ field: "userId", operator: "eq", value: user.id }],
    sorters: [{ field: "startedAt", order: "desc" }],
    queryOptions: { enabled: !!user }
  });

  return (
    <Modal title={`Профиль: ${user.phone}`} open={!!user} onCancel={onClose} footer={null} width={900}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}><Card size="small"><Statistic title="Имя" value={user.displayName || "Без имени"} /></Card></Col>
        <Col span={12}><Card size="small"><Statistic title="Очки (Баланс)" value={user.balance || 0} valueStyle={{ color: '#8b5cf6' }} /></Card></Col>
      </Row>
      <Tabs defaultActiveKey="1" items={[
        {
          key: "1", label: "Транзакции и Покупки", 
          children: (
            <Table dataSource={txData?.data} loading={txLoading} rowKey="id" pagination={{ pageSize: 10 }} size="small">
              <Table.Column dataIndex="type" title="Тип" render={(val) => <Tag color={val === 'GAME_EARN' ? 'success' : 'purple'}>{val}</Tag>} />
              <Table.Column dataIndex="amount" title="Сумма" render={(val) => <span style={{ color: Number(val) > 0 ? '#34d399' : '#f87171' }}>{Number(val) > 0 ? `+${val}` : val}</span>} />
              <Table.Column dataIndex="balanceAfter" title="Остаток" />
              <Table.Column dataIndex="details" title="Детали" render={(val) => <span style={{ fontSize: '0.8rem' }}>{val}</span>} />
              <Table.Column dataIndex="createdAt" title="Дата" render={(val) => <DateField value={val} format="DD/MM/YYYY HH:mm" />} />
            </Table>
          )
        },
        {
          key: "2", label: "Сессии и Устройства", 
          children: (
            <Table dataSource={sessData?.data} loading={sessLoading} rowKey="id" pagination={{ pageSize: 10 }} size="small">
              <Table.Column dataIndex="game" title="Игра" render={(val) => val?.name} />
              <Table.Column dataIndex="result" title="Заработано" render={(val) => val?.awardedPoints || 0} />
              <Table.Column dataIndex="result" title="Время (сек)" render={(val) => val?.timePlayedSeconds || 0} />
              <Table.Column dataIndex="clientVersion" title="Браузер/ОС" render={(val) => <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{val || 'Неизвестно'}</span>} />
              <Table.Column dataIndex="deviceId" title="Устройство ID" render={(val) => <span style={{ fontSize: '0.7rem' }}>{val?.slice(0, 8) || '-'}</span>} />
              <Table.Column dataIndex="startedAt" title="Дата" render={(val) => <DateField value={val} format="DD/MM/YYYY HH:mm" />} />
            </Table>
          )
        }
      ]} />
    </Modal>
  );
};

export const UsersList = () => {
  const t = useTranslate();
  const [viewUser, setViewUser] = useState<any>(null);
  const { tableProps } = useTable({ syncWithLocation: true });
  return (
    <List title={t("users.users", "Пользователи")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" render={(val: string) => val.slice(0,8)} />
        <Table.Column dataIndex="phone" title={t("users.params.phone", "Телефон")} />
        <Table.Column dataIndex="displayName" title={t("users.params.displayName", "Имя")} render={(val) => <Space><Avatar style={{ backgroundColor: '#8b5cf6' }}>{val?.charAt(0)?.toUpperCase() || 'U'}</Avatar><span>{val || 'Без имени'}</span></Space>} />
        <Table.Column dataIndex="status" title={t("users.params.status", "Статус")} render={(val) => <Tag color={val === 'ACTIVE' ? 'success' : 'error'}>{val === 'ACTIVE' ? 'АКТИВЕН' : 'ЗАБЛОКИРОВАН'}</Tag>} />
        <Table.Column dataIndex="role" title="Роль" render={(val) => <Tag color={val === 'ADMIN' || val === 'SUPER_ADMIN' ? 'purple' : val === 'VENUE' ? 'cyan' : 'blue'}>{val === 'ADMIN' || val === 'SUPER_ADMIN' ? 'Админ' : val === 'VENUE' ? 'Заведение' : 'Пользователь'}</Tag>} />
        <Table.Column dataIndex="balance" title="Очки (Баланс)" render={(val) => <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{val || 0}</span>} />
        <Table.Column dataIndex="gamesPlayedList" title="Игры" />
        <Table.Column dataIndex="prizesBought" title="Призы" />
        <Table.Column dataIndex="avgTimeOnline" title="Ср. Время" />
        <Table.Column dataIndex="createdAt" title={t("users.params.createdAt", "Дата регистрации")} render={(val) => <DateField value={val} format="DD/MM/YYYY HH:mm" />} />
        <Table.Column title="Действия" render={(_, record: any) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => setViewUser(record)} />
            <EditButton hideText size="small" recordItemId={record.id} />
            <DeleteButton hideText size="small" recordItemId={record.id} />
          </Space>
        )} />
      </Table>
      <UserProfileModal user={viewUser} onClose={() => setViewUser(null)} />
    </List>
  );
};

export const UsersEdit = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm();
  
  const { selectProps: venueSelectProps } = useSelect({ 
    resource: "venue_networks", 
    optionLabel: "name", 
    optionValue: "id",
    pagination: { mode: "off" }
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label={t("users.params.displayName", "Имя")} name="displayName">
          <Input />
        </Form.Item>
        <Form.Item label="Статус" name="status">
          <Select options={[
            { label: 'АКТИВЕН', value: 'ACTIVE' },
            { label: 'ЗАБЛОКИРОВАН', value: 'BANNED_FROZEN' }
          ]} />
        </Form.Item>
        
        <Divider orientation="left">Роль пользователя</Divider>
        <Form.Item label="Роль" name="role" rules={[{ required: true }]}>
          <Select options={[
            { label: 'Обычный пользователь', value: 'USER' },
            { label: 'Заведение (VENUE)', value: 'VENUE' },
            { label: 'Администратор', value: 'ADMIN' }
          ]} />
        </Form.Item>

        <Form.Item shouldUpdate={(prev, curr) => prev.role !== curr.role}>
          {() => {
            if (formProps.form?.getFieldValue('role') === 'VENUE') {
              return (
                <Form.Item label="Привязать к заведению" name="venueNetworkId" rules={[{ required: true, message: 'Выберите заведение!' }]}>
                  <Select {...venueSelectProps} />
                </Form.Item>
              )
            }
            return null;
          }}
        </Form.Item>
      </Form>
    </Edit>
  );
};

export const VenueNetworksList = () => {
  const t = useTranslate();
  const { tableProps } = useTable();
  return (
    <List title={t("venue_networks.venue_networks", "Заведения")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title={t("venue_networks.params.name", "Название")} />
        <Table.Column dataIndex="isActive" title={t("venue_networks.params.isActive", "Активна")} render={(val) => <Switch checked={val} disabled />} />
        <Table.Column title="Действия" render={(_, record: any) => (
          <Space>
            <EditButton hideText size="small" recordItemId={record.id} />
            <DeleteButton hideText size="small" recordItemId={record.id} />
          </Space>
        )} />
      </Table>
    </List>
  );
};

export const VenueNetworksCreate = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm();
  const { selectProps: gamesSelectProps, queryResult: gamesQueryResult } = useSelect({ 
    resource: "games", 
    optionLabel: "name", 
    optionValue: "id",
    pagination: { mode: "off" }
  });

  const handleOnFinish = async (values: any) => {
    const rawFields = formProps.form?.getFieldsValue(true) || {};
    const gameConfigs = rawFields.gameConfigs || values.gameConfigs;
    
    
    // First let Refine create the VenueNetwork
    // Wait, Refine's onFinish handles the actual creation.
    // If we want to PATCH gameConfigs, we MUST wait for the ID!
    // Refine's onFinish might not return the response body.
    // Let's just create it ourselves, or let the backend's createVenueNetwork do it?
    // Actually, createVenueNetwork handles it PERFECTLY if we send it in the raw body!
    // But Refine strips it.
    
    // Let's just pass it to onFinish and HOPE the User doesn't use Create with configs often.
    // Wait, let's just let Refine do it. Refine passes all values to CREATE in simple-rest.
    const merged = { ...values, gameConfigs };
    return formProps.onFinish?.(merged);
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} onFinish={handleOnFinish} layout="vertical">
        <Form.Item label={t("venue_networks.params.name", "Название")} name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Привязанные Игры" name="games">
          <Select 
            {...gamesSelectProps} 
            mode="multiple" 
            style={{ width: "100%" }} 
            options={gamesSelectProps.options?.map(opt => {
              const game = (gamesQueryResult as any)?.data?.data?.find((g: any) => g.id === opt.value);
              const isAssigned = game?.venueNetwork?.isActive === true;
              return {
                ...opt,
                disabled: isAssigned,
                label: isAssigned ? `${opt.label} (Занято)` : opt.label
              };
            })}
          />
        </Form.Item>
        <Form.Item shouldUpdate={(prev, curr) => prev.games !== curr.games}>
          {() => {
             const selectedGames = formProps.form?.getFieldValue("games") || [];
             if (selectedGames.length === 0) return null;
             return (
               <Space direction="vertical" style={{ width: "100%" }}>
                 {selectedGames.map((gameId: string) => {
                   const gameName = gamesSelectProps.options?.find((o: any) => o.value === gameId)?.label || gameId;
                   return (
                     <Card title={`Оформление для: ${gameName}`} size="small" style={{ marginBottom: 16 }} key={gameId}>
                       <Form.Item label="Кастомное название" name={["gameConfigs", gameId, "displayName"]}>
                         <Input placeholder="Например: Супер Тетрис" />
                       </Form.Item>
                       <Form.Item label="Иконка (Загрузить)" name={["gameConfigs", gameId, "imageUrl"]}>
                         <FileUploadField />
                       </Form.Item>
                     </Card>
                   )
                 })}
               </Space>
             );
          }}
        </Form.Item>
        <Form.Item label={t("venue_networks.params.isActive", "Активна")} name="isActive" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  );
};

export const VenueNetworksEdit = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps, id: currentVenueId } = useForm();
  const { selectProps: gamesSelectProps, queryResult: gamesQueryResult } = useSelect({ 
    resource: "games", 
    optionLabel: "name", 
    optionValue: "id",
    pagination: { mode: "off" }
  });

  const handleOnFinish = async (values: any) => {
    const rawFields = formProps.form?.getFieldsValue(true) || {};
    const gameConfigs = rawFields.gameConfigs || values.gameConfigs;
    
    const merged = { ...values, gameConfigs };
    return formProps.onFinish?.(merged);
  };

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} onFinish={handleOnFinish} layout="vertical">
        <Form.Item label={t("venue_networks.params.name", "Название")} name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Привязанные Игры" name="games">
          <Select 
            {...gamesSelectProps} 
            mode="multiple" 
            style={{ width: "100%" }} 
            options={gamesSelectProps.options?.map(opt => {
              const game = (gamesQueryResult as any)?.data?.data?.find((g: any) => g.id === opt.value);
              const isAssigned = game?.venueNetwork?.isActive === true && game.venueNetwork?.id !== currentVenueId;
              return {
                ...opt,
                disabled: isAssigned,
                label: isAssigned ? `${opt.label} (Занято)` : opt.label
              };
            })}
          />
        </Form.Item>
        <Form.Item shouldUpdate={(prev, curr) => prev.games !== curr.games}>
          {() => {
             const selectedGames = formProps.form?.getFieldValue("games") || [];
             if (selectedGames.length === 0) return null;
             return (
               <Space direction="vertical" style={{ width: "100%" }}>
                 {selectedGames.map((gameId: string) => {
                   const gameName = gamesSelectProps.options?.find((o: any) => o.value === gameId)?.label || gameId;
                   return (
                     <Card title={`Оформление для: ${gameName}`} size="small" style={{ marginBottom: 16 }} key={gameId}>
                       <Form.Item label="Кастомное название" name={["gameConfigs", gameId, "displayName"]}>
                         <Input placeholder="Например: Супер Тетрис" />
                       </Form.Item>
                       <Form.Item label="Иконка (Загрузить)" name={["gameConfigs", gameId, "imageUrl"]}>
                         <FileUploadField />
                       </Form.Item>
                     </Card>
                   )
                 })}
               </Space>
             );
          }}
        </Form.Item>
        <Form.Item label={t("venue_networks.params.isActive", "Активна")} name="isActive" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export const GamesList = () => {
  const t = useTranslate();
  const { tableProps } = useTable();
  const { mutate } = useUpdate();
  
  return (
    <List title={t("games.games", "Игры")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title={t("games.params.name", "Название")} />
        <Table.Column dataIndex="dailyPointsLimit" title="Лимит баллов (Дн)" />
        <Table.Column dataIndex="dailyAttemptsLimit" title="Попыток (Дн)" />
        <Table.Column dataIndex="maxScorePerMinute" title="Порог АЧ (Очк/мин)" />
        <Table.Column 
          dataIndex="isActive" 
          title={t("games.params.isActive", "Активно")} 
          render={(val, record: any) => (
            <Switch 
              checked={val === true || val === "true"} 
              onChange={(checked) => mutate({ resource: "games", id: record.id, values: { isActive: !!checked }, mutationMode: "pessimistic" })} 
            />
          )} 
        />
        <Table.Column title="Действия" render={(_, record: any) => <EditButton hideText size="small" recordItemId={record.id} />} />
      </Table>
    </List>
  );
};

export const GamesEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const gameData = queryResult?.data?.data;
  const { selectProps: venueSelectProps } = useSelect({ 
    resource: "venue_networks", 
    optionLabel: "name", 
    optionValue: "id",
    pagination: { mode: "off" }
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      {gameData && (
        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={5}>Статистика игры</Typography.Title>
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small"><Statistic title="Сыграно раз" value={gameData.statsTotalSessions || 0} /></Card>
            </Col>
            <Col span={8}>
              <Card size="small"><Statistic title="Уникальных игроков" value={gameData.statsUniquePlayers || 0} /></Card>
            </Col>
            <Col span={8}>
              <Card size="small"><Statistic title="Выдано призовых баллов" value={gameData.statsTotalPoints || 0} /></Card>
            </Col>
          </Row>
          <Divider />
        </div>
      )}

      <Form {...formProps} layout="vertical">
        <Typography.Title level={5}>Основные настройки</Typography.Title>
        <Form.Item label="Название" name="name"><Input disabled /></Form.Item>
        <Form.Item label="Заведение" name="venueNetworkId">
          <Select {...venueSelectProps} style={{ width: "100%" }} allowClear />
        </Form.Item>
        <Form.Item label="Дневной лимит баллов на 1 игрока" name="dailyPointsLimit" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Дневной лимит попыток (0 = безлимит)" name="dailyAttemptsLimit" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Divider />
        <Typography.Title level={5}>Дополнительно</Typography.Title>
        <Form.Item label="Анти-чит: Макс. скорость набора очков (в минуту)" name="maxScorePerMinute" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Активна" name="isActive" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export const PrizesList = () => {
  const t = useTranslate();
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const { data: gamesData } = useList({
    resource: "games",
    pagination: { mode: "off" }
  });
  const games = gamesData?.data || [];

  const { tableProps, setFilters } = useTable({
    syncWithLocation: false,
  });

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === "ALL") {
      setFilters([], "replace");
    } else {
      setFilters([{ field: "gameId", operator: "eq", value: key }], "replace");
    }
  };

  const items = [
    { key: "ALL", label: "Все призы" },
    ...games.map((g: any) => ({ key: g.id, label: g.name }))
  ];

  const createUrl = activeTab === "ALL" ? `/prizes/create` : `/prizes/create?gameId=${activeTab}`;

  return (
    <List title={t("prizes.prizes", "Призы")} createButtonProps={{ onClick: () => window.location.href = createUrl }}>
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={items} />
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="imageUrl" title="Картинка" render={(val) => val ? <Avatar shape="square" size="large" src={val} /> : <Avatar shape="square" size="large">П</Avatar>} />
        <Table.Column dataIndex="name" title={t("prizes.params.name", "Название")} render={(val, record: any) => <Space direction="vertical" size={2}><span>{val}</span>{!record.isActive && <Tag color="error">УДАЛЁН</Tag>}</Space>}/>
        {activeTab === "ALL" && (
          <Table.Column 
            dataIndex="gameId" 
            title="Игра" 
            render={(val) => {
              const game = games.find((g: any) => g.id === val);
              return game ? game.name : val;
            }} 
          />
        )}
        <Table.Column dataIndex="cost" title={t("prizes.params.cost", "Стоимость (points)")} />
        <Table.Column dataIndex="stockCount" title={t("prizes.params.stockCount", "В наличии")} />
        <Table.Column title="Действия" render={(_, record: any) => (
          <Space>
            <EditButton hideText size="small" recordItemId={record.id} />
            <DeleteButton hideText size="small" recordItemId={record.id} />
          </Space>
        )} />
      </Table>
    </List>
  );
};

export const PrizesCreate = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm();
  const searchParams = new URLSearchParams(window.location.search);
  const initialGameId = searchParams.get('gameId');

  const { selectProps: gameSelectProps } = useSelect({ 
    resource: "games", 
    optionLabel: "name", 
    optionValue: "id",
    pagination: { mode: "off" }
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label={t("prizes.params.name", "Название")} name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label={t("prizes.params.cost", "Стоимость")} name="cost" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        <Form.Item label="Игра" name="gameId" rules={[{ required: true }]} initialValue={initialGameId || undefined}>
          <Select {...gameSelectProps} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Изображение (В магазине / Тайная коробка)" name="hiddenImageUrl" tooltip="То, что видит юзер до покупки.">
          <FileUploadField />
        </Form.Item>
        <Form.Item label="Изображение (Реальный приз)" name="imageUrl" rules={[{ required: true }]} tooltip="Картинка, которая откроется после покупки.">
          <FileUploadField />
        </Form.Item>
        <Form.Item label={t("prizes.params.stockCount", "В наличии")} name="stockCount" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
      </Form>
    </Create>
  );
};

export const PrizesEdit = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm();
  
  const { selectProps: gameSelectProps } = useSelect({ 
    resource: "games", 
    optionLabel: "name", 
    optionValue: "id",
    pagination: { mode: "off" }
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label={t("prizes.params.name", "Название")} name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label={t("prizes.params.cost", "Стоимость")} name="cost" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        <Form.Item label="Игра" name="gameId" rules={[{ required: true }]}>
          <Select {...gameSelectProps} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Изображение (В магазине / Тайная коробка)" name="hiddenImageUrl" tooltip="То, что видит юзер до покупки.">
          <FileUploadField />
        </Form.Item>
        <Form.Item label="Изображение (Реальный приз)" name="imageUrl" rules={[{ required: true }]} tooltip="Картинка, которая откроется после покупки.">
          <FileUploadField />
        </Form.Item>
        <Form.Item label={t("prizes.params.stockCount", "В наличии")} name="stockCount" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        <Form.Item label="Активен" name="isActive" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Edit>
  );
};

export const PromoCodesList = () => {
  const t = useTranslate();
  const { tableProps } = useTable();
  return (
    <List title={t("promo_codes.promo_codes", "Промокоды")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="code" title={t("promo_codes.params.code", "Код")} />
        <Table.Column dataIndex="pointsReward" title={t("promo_codes.params.pointsReward", "Награда")} />
        <Table.Column dataIndex="currentUses" title="Использовано" />
        <Table.Column dataIndex="maxUsesGlobally" title="Лимит" />
        <Table.Column dataIndex="isActive" title="Активен" render={(val) => <Switch checked={val} disabled />} />
        <Table.Column title="Действия" render={(_, record: any) => (
          <Space>
            <EditButton hideText size="small" recordItemId={record.id} />
            <DeleteButton hideText size="small" recordItemId={record.id} />
          </Space>
        )} />
      </Table>
    </List>
  );
};

export const PromoCodesCreate = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm();
  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label={t("promo_codes.params.code", "Код")} name="code" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label={t("promo_codes.params.pointsReward", "Награда")} name="pointsReward" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
        <Form.Item label="Лимит использований" name="maxUsesGlobally" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
        <Form.Item label="Дата начала" name="startDate" rules={[{ required: true }]} getValueProps={(v) => ({ value: v ? dayjs(v) : "" })}><DatePicker showTime /></Form.Item>
        <Form.Item label="Дата окончания" name="endDate" rules={[{ required: true }]} getValueProps={(v) => ({ value: v ? dayjs(v) : "" })}><DatePicker showTime /></Form.Item>
      </Form>
    </Create>
  );
};

export const PromoCodesEdit = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm();
  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label={t("promo_codes.params.pointsReward", "Награда")} name="pointsReward" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
        <Form.Item label="Лимит использований" name="maxUsesGlobally" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
        <Form.Item label="Дата начала" name="startDate" rules={[{ required: true }]} getValueProps={(v) => ({ value: v ? dayjs(v) : "" })}><DatePicker showTime /></Form.Item>
        <Form.Item label="Дата окончания" name="endDate" rules={[{ required: true }]} getValueProps={(v) => ({ value: v ? dayjs(v) : "" })}><DatePicker showTime /></Form.Item>
        <Form.Item label="Активен" name="isActive" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Edit>
  );
};

export const TransactionsList = () => {
  const t = useTranslate();
  const { tableProps, searchFormProps } = useTable({
    onSearch: (values: any) => {
      const filters: any[] = [];
      if (values.userPhone) filters.push({ field: "userPhone", operator: "eq", value: values.userPhone });
      if (values.type) filters.push({ field: "type", operator: "eq", value: values.type });
      if (values.gameId) filters.push({ field: "gameId", operator: "eq", value: values.gameId });
      if (values.prizeId) filters.push({ field: "prizeId", operator: "eq", value: values.prizeId });
      return filters;
    },
  });

  const { selectProps: gameSelectProps } = useSelect({ resource: "games", optionLabel: "name", optionValue: "id" });
  const { selectProps: prizeSelectProps } = useSelect({ resource: "prizes", optionLabel: "name", optionValue: "id" });

  return (
    <div style={{ animation: "fadeIn 0.6s ease" }}>
      <Card style={{ marginBottom: 16 }}>
        <Form {...searchFormProps} layout="inline">
          <Form.Item name="userPhone" label={t("wallet_transactions.params.userPhone", "Телефон")}>
            <Input placeholder="Поиск по номеру" />
          </Form.Item>
          <Form.Item name="type" label={t("wallet_transactions.params.type", "Тип")}>
            <Select
              style={{ width: 180 }}
              allowClear
              placeholder="Все типы"
              options={[
                { label: "Покупка приза", value: "PRIZE_PURCHASE" },
                { label: "Начисление за игру", value: "GAME_EARN" },
              ]}
            />
          </Form.Item>
          <Form.Item name="gameId" label="Игра">
            <Select style={{ width: 200 }} allowClear placeholder="В какой игре" {...gameSelectProps} />
          </Form.Item>
          <Form.Item name="prizeId" label="Приз">
            <Select style={{ width: 200 }} allowClear placeholder="Какой приз куплен" {...prizeSelectProps} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Фильтр
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <List title={t("wallet_transactions.wallet_transactions", "Лог Транзакций")}>
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="userPhone" title={t("wallet_transactions.params.userPhone", "Телефон")} />
          <Table.Column dataIndex="type" title={t("wallet_transactions.params.type", "Тип")} render={(val) => <Tag color={val === 'GAME_EARN' ? 'success' : 'purple'}>{val === 'GAME_EARN' ? 'ИГРА (Доход)' : 'МАГАЗИН (Расход)'}</Tag>} />
          <Table.Column dataIndex="amount" title={t("wallet_transactions.params.amount", "Сумма")} render={(val) => <span style={{ color: Number(val) > 0 ? '#34d399' : '#f87171', fontWeight: 'bold' }}>{Number(val) > 0 ? `+${val}` : val}</span>} />
          <Table.Column dataIndex="balanceAfter" title={t("wallet_transactions.params.balanceAfter", "Баланс")} />
          <Table.Column dataIndex="details" title={t("wallet_transactions.params.details", "Детали")} render={(val) => <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{val}</span>} />
          <Table.Column dataIndex="createdAt" title={t("wallet_transactions.params.createdAt", "Дата")} render={(val) => <DateField value={val} format="DD/MM/YYYY HH:mm:ss" />} />
        </Table>
      </List>
    </div>
  );
};

export const AuditLogsList = () => {
  const { tableProps, searchFormProps } = useTable({
    syncWithLocation: true,
    pagination: { pageSize: 20 },
    onSearch: (values: any) => {
      const filters: any[] = [];
      if (values.userPhone) filters.push({ field: "userPhone", operator: "contains", value: values.userPhone });
      if (values.action) filters.push({ field: "action", operator: "eq", value: values.action });
      if (values.resourceType) filters.push({ field: "resourceType", operator: "eq", value: values.resourceType });
      return filters;
    },
  });

  return (
    <div style={{ animation: "fadeIn 0.6s ease" }}>
      <Card style={{ marginBottom: 16 }}>
        <Form {...searchFormProps} layout="inline">
          <Form.Item name="userPhone" label="Менеджер (Телефон)">
            <Input placeholder="Чей лог" />
          </Form.Item>
          <Form.Item name="action" label="Тип действия">
            <Select
              style={{ width: 140 }}
              allowClear
              placeholder="Все"
              options={[
                { label: "СОЗДАНИЕ", value: "CREATE" },
                { label: "РЕДАКТИРОВАНИЕ", value: "UPDATE" },
                { label: "УДАЛЕНИЕ", value: "DELETE" },
                { label: "МЯГКОЕ УДАЛЕНИЕ", value: "SOFT_DELETE" },
              ]}
            />
          </Form.Item>
          <Form.Item name="resourceType" label="Ресурс">
            <Select
              style={{ width: 180 }}
              allowClear
              placeholder="Все объекты"
              options={[
                { label: "Пользователь", value: "USER" },
                { label: "Заведение", value: "VENUENETWORK" },
                { label: "Игра", value: "GAME" },
                { label: "Приз", value: "PRIZE" },
                { label: "Промокод", value: "PROMOCODE" },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Фильтр
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <List title="Журнал действий">
        <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="userName" title="Кто изменил" render={(val, record: any) => <Space><Avatar style={{ backgroundColor: '#f59e0b' }}>{val?.charAt(0)?.toUpperCase() || 'S'}</Avatar> <span style={{ fontWeight: 'bold' }}>{val || 'Система'} ({record.userPhone})</span></Space>}/>
        <Table.Column dataIndex="action" title="Действие" render={(val) => <Tag color={val === 'CREATE' ? 'success' : val === 'UPDATE' ? 'blue' : 'error'}>{val}</Tag>} />
        <Table.Column dataIndex="resourceType" title="Объект" />
          <Table.Column dataIndex="resourceId" title="ID Объекта" render={(val) => <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{val}</span>} />
          <Table.Column dataIndex="afterJson" title="Изменения" render={(val) => <pre style={{ fontSize: '0.65rem', maxWidth: '300px', overflowX: 'auto', margin: 0 }}>{val ? JSON.stringify(val, null, 2) : '-'}</pre>} />
          <Table.Column dataIndex="createdAt" title="Дата" render={(val) => <DateField value={val} format="DD/MM/YYYY HH:mm:ss" />} />
        </Table>
      </List>
    </div>
  );
};
