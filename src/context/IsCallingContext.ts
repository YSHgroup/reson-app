import React, { createContext } from 'react';

const IsCallingContext = createContext<boolean>(false);

export default IsCallingContext;