"use client";

import { useState } from "react";
import Button from "universal/Button";
import Fields from "./Fields";
import Tabs from "./Tabs";
import { Role } from "schema/schema";
import { useRouter } from "next/navigation";
import { LoginData, RegisterData } from "schema/auth";
import { loginAction, registerAction } from "app/actions/auth";

const Form = ({ type }: { type: "register" | "login" }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<Role>(Role.COMPANY);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) {
      return;
    }
    try {
      if (type === "register") {
        const formData: RegisterData = {
          name: username,
          email,
          password,
          type: activeTab,
        };
        await registerAction(formData);
        router.push("/login");
      } else {
        const formData: LoginData = {
          email,
          password,
        };
        const response = await loginAction(formData);
        if (response.success) {
          router.push("/dashboard");
        } else {
          alert("Login failed");
        }
      }
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      alert(errorMessage);
    }
  };

  return (
    <div>
      {type === "register" && (
        <Tabs
          tabs={[Role.COMPANY, Role.APPLICANT]}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      <form
        className="w-full mx-auto mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="space-y-4">
          {type === "register" && (
            <div>
              <Fields
                label={`${activeTab} name`}
                value={username}
                setValue={setUsername}
              />
            </div>
          )}

          <div>
            <Fields label="Email" value={email} setValue={setEmail} />
          </div>

          <div>
            <Fields
              type="password"
              label="Password"
              value={password}
              setValue={setPassword}
            />
          </div>
        </div>

        <Button label="Submit" type="primary" />
      </form>
    </div>
  );
};

export default Form;
