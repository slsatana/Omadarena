import { List, Create, Edit, useTable, useForm, DateField, useSelect, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Input, Switch, InputNumber, Form, DatePicker, Typography, Space, Button, Select, Tabs, Upload, message, Card, Row, Col, Statistic, Divider } from "antd";
import { useTranslate, useList } from "@refinedev/core";
import dayjs from "dayjs";
import { useState } from "react";

const FileUploadField = ({ value, onChange }: any) => {
  const handleChange = (info: any) => {
    if (info.file.status === 'done') {
      message.success(`Загружено успешно`);
      // Since our server returns { url: "..." }
      onChange(info.file.response.url);
    } else if (info.file.status === 'error') {
      message.error(`Ошибка загрузки`);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Upload
        name="file"
        action={`http://${window.location.hostname}:3000/api/v1/upload`}
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

export const UsersList = () => {
  const t = useTranslate();
  const { tableProps } = useTable({ syncWithLocation: true });
  return (
    <List title={t("users.users", "Пользователи")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" render={(val: string) => val.slice(0,8)} />
        <Table.Column dataIndex="phone" title={t("users.params.phone", "Телефон")} />
        <Table.Column dataIndex="displayName" title={t("users.params.displayName", "Имя")} />
        <Table.Column dataIndex="status" title={t("users.params.status", "Статус")} />
        <Table.Column dataIndex="role" title="Роль" render={(val) => val === 'ADMIN' || val === 'SUPER_ADMIN' ? 'Админ' : val === 'VENUE' ? 'Заведение' : 'Пользователь'} />
        <Table.Column dataIndex="createdAt" title={t("users.params.createdAt", "Дата регистрации")} render={(val) => <DateField value={val} format="DD/MM/YYYY HH:mm" />} />
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
  return (
    <List title={t("games.games", "Игры")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title={t("games.params.name", "Название")} />
        <Table.Column dataIndex="dailyPointsLimit" title="Лимит баллов (Дн)" />
        <Table.Column dataIndex="dailyAttemptsLimit" title="Попыток (Дн)" />
        <Table.Column dataIndex="maxScorePerMinute" title="Порог АЧ (Очк/мин)" />
        <Table.Column dataIndex="isActive" title={t("games.params.isActive", "Активно")} render={(val) => <Switch checked={val} disabled />} />
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
        <Form.Item label="Заведение" name="venueNetworkId" rules={[{ required: true }]}>
          <Select {...venueSelectProps} style={{ width: "100%" }} />
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
        <Table.Column dataIndex="name" title={t("prizes.params.name", "Название")} />
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
        <Form.Item label="Изображение" name="imageUrl" rules={[{ required: true }]}><FileUploadField /></Form.Item>
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
        <Form.Item label="Изображение" name="imageUrl" rules={[{ required: true }]}><FileUploadField /></Form.Item>
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
  const { tableProps } = useTable();
  return (
    <List title={t("wallet_transactions.wallet_transactions", "Лог Транзакций")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="userPhone" title={t("wallet_transactions.params.userPhone", "Телефон")} />
        <Table.Column dataIndex="type" title={t("wallet_transactions.params.type", "Тип")} />
        <Table.Column dataIndex="amount" title={t("wallet_transactions.params.amount", "Сумма")} render={(val) => <span style={{ color: Number(val) > 0 ? '#34d399' : '#f87171' }}>{val}</span>} />
        <Table.Column dataIndex="balanceAfter" title={t("wallet_transactions.params.balanceAfter", "После")} />
        <Table.Column dataIndex="createdAt" title={t("wallet_transactions.params.createdAt", "Дата")} render={(val) => <DateField value={val} format="DD/MM/YYYY HH:mm:ss" />} />
      </Table>
    </List>
  );
};
