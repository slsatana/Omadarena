import { useState, useEffect } from "react";
import { useRegister, useTranslate } from "@refinedev/core";
import { Card, Input, Button, Typography, Layout, Space } from "antd";
import { Link, useSearchParams } from "react-router-dom";

const { Title, Text } = Typography;

export const Register = () => {
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState(searchParams.get("phone") || "+998");
  const [displayName, setDisplayName] = useState(searchParams.get("name") || "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "verify">(
    searchParams.get("step") === "verify" ? "verify" : "phone"
  );
  const { mutate: register } = useRegister();
  const t = useTranslate();

  useEffect(() => {
    if (searchParams.get("step") === "verify") {
      setStep("verify");
      if (searchParams.get("phone")) setPhone(searchParams.get("phone") as string);
      if (searchParams.get("name")) setDisplayName(searchParams.get("name") as string);
    }
  }, [searchParams]);

  const handlePhoneSubmit = () => {
    register({ phone, displayName });
  };

  const handleVerifySubmit = () => {
    register({ phone, code, displayName });
  };

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#030305", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Card style={{ width: 400, backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: 16 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={2} style={{ color: "#fff", margin: 0 }}>OMAD ARENA</Title>
          <Text style={{ color: "#a1a1aa" }}>{t("pages.register.title", "Регистрация")}</Text>
        </div>

        {step === "phone" ? (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <Text style={{ color: "#e4e4e7", display: "block", marginBottom: 8 }}>Имя / Никнейм</Text>
              <Input 
                size="large" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                style={{ backgroundColor: "#09090b", color: "#fff", borderColor: "#3f3f46" }}
                placeholder="Василий"
              />
            </div>
            <div>
              <Text style={{ color: "#e4e4e7", display: "block", marginBottom: 8 }}>{t("users.params.phone", "Телефон")}</Text>
              <Input 
                size="large" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                style={{ backgroundColor: "#09090b", color: "#fff", borderColor: "#3f3f46" }}
              />
            </div>
            <Button 
              type="primary" 
              size="large" 
              block 
              onClick={handlePhoneSubmit}
              style={{ background: "linear-gradient(90deg, #8b5cf6, #d946ef)", border: "none", fontWeight: 600 }}
            >
              Получить код
            </Button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Text style={{ color: "#a1a1aa" }}>Уже есть аккаунт? </Text>
              <Link to="/login" style={{ color: "#d946ef", fontWeight: 600 }}>Войти</Link>
            </div>
          </Space>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <Text style={{ color: "#e4e4e7", display: "block", marginBottom: 8 }}>Код из СМС</Text>
              <Input 
                size="large" 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                style={{ backgroundColor: "#09090b", color: "#fff", borderColor: "#3f3f46" }}
                placeholder="00000"
              />
            </div>
            <Button 
              type="primary" 
              size="large" 
              block 
              onClick={handleVerifySubmit}
              style={{ background: "linear-gradient(90deg, #8b5cf6, #d946ef)", border: "none", fontWeight: 600 }}
            >
              Зарегистрироваться
            </Button>
          </Space>
        )}
      </Card>
    </Layout>
  );
};
