export type CustomerTokens = {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresIn: number; // in seconds
  expiresAt: number; // timestamp in ms
};

export type CustomerSession = {
  accessToken: string;
  expiresAt: number;
  idToken?: string;
};

export type CustomerAddress = {
  id: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  formatted?: string[];
};

export type CustomerOrderLineItem = {
  id?: string;
  title: string;
  quantity: number;
  price?: {
    amount: string;
    currencyCode: string;
  };
  totalPrice?: {
    amount: string;
    currencyCode: string;
  };
  image?: {
    url: string;
    altText?: string;
  };
};

export type CustomerOrder = {
  id: string;
  name: string;
  number?: string | number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  subtotalPrice?: {
    amount: string;
    currencyCode: string;
  };
  totalTax?: {
    amount: string;
    currencyCode: string;
  };
  totalShippingPrice?: {
    amount: string;
    currencyCode: string;
  };
  lineItems: {
    nodes: CustomerOrderLineItem[];
  };
  shippingAddress?: CustomerAddress;
};

export type CustomerProfile = {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  emailAddress?: {
    emailAddress?: string;
  };
  phoneNumber?: {
    phoneNumber?: string;
  };
  defaultAddress?: CustomerAddress;
  addresses?: {
    nodes: CustomerAddress[];
  };
  orders?: {
    nodes: CustomerOrder[];
  };
  wishlist?: string[];
};

export type MetafieldsSetInput = {
  ownerId: string;
  namespace: string;
  key: string;
  type?: string;
  value: string;
};

export type CustomerMetafield = {
  id?: string;
  namespace?: string;
  key?: string;
  value?: string;
};

export type CustomerAccountGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
};
