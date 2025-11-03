"use client";

import { useState } from "react";
import Button from "universal/Button";
import Fields from "./Fields";
import Tabs from "./Tabs";
import { Role } from "schema/shcema";
import { useRouter } from "next/navigation";
import { LoginData, RegisterData } from "schema/auth";
import { loginAction, registerAction } from "app/actions/auth";

const Form = ({ type }: { type: "register" | "login" }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const tabs: Role[] = [Role.COMPANY, Role.APPLICANT];
  const [activeTab, setActiveTab] = useState<Role>(Role.COMPANY);
  const router = useRouter();
  if (type === "login") {
    tabs.push(Role.ADMIN);
  }

  const handleSubmit = async () => {
    // validate the form

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
        alert("Registration successful");
        router.push("/login");
      } else {
        const formData: LoginData = {
          email,
          password,
        };
        const response = await loginAction(formData);
        if (response.success) {
          alert("Login successful");
          router.push("/dashboard");
        } else {
          alert("Login failed");
        }
      }
    } catch (error) {
      console.error(error);
      alert(error as string);
    }
  };

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

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
                label="Username"
                value={username}
                setValue={setUsername}
              />
            </div>
          )}

          <div>
            <Fields label="Email" value={email} setValue={setEmail} />
          </div>

          <div>
            <Fields label="Password" value={password} setValue={setPassword} />
          </div>
        </div>

        <Button label="Submit" type="primary" />
      </form>
    </div>
  );
};

export default Form;
