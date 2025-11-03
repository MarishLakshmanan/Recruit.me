"use client";
import Link from "next/link";
import React from "react";
import Container from "universal/Container";
import Form from "universal/auth/Form";
const Login = () => {
  return (
    <Container>
      <div className="w-full  max-w-md mx-auto mt-[20%]">
        <h1 className="text-2xl font-bold text-center mb-4">LOGIN</h1>
        <Form type="login" />
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-primary underline ">
            Sign Up
          </Link>
        </p>
      </div>
    </Container>
  );
};

export default Login;
