"use client";

import { useState } from "react";
import { Role } from "schema/shcema";
import Container from "universal/Container";
import Form from "universal/auth/Form";
import Tabs from "universal/auth/Tabs";
const App = () => {
  return (
    <Container>
      <Form type="register" />
    </Container>
  );
};

export default App;
