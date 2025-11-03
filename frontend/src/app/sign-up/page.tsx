"use client";
import Link from "next/link";
import Container from "universal/Container";
import Form from "universal/auth/Form";

const SignUp = () => {
  return (
    <Container>
      <div className="w-full  max-w-md mx-auto mt-20">
        <h1 className="text-2xl font-bold text-center mb-4">SIGN UP</h1>
        <Form type="register" />
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline ">
            Login
          </Link>
        </p>
      </div>
    </Container>
  );
};

export default SignUp;
