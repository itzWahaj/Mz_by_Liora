const shopPolicyFragment = /* GraphQL */ `
  fragment shopPolicy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
`;

export const getShopPoliciesQuery = /* GraphQL */ `
  query getShopPolicies {
    shop {
      privacyPolicy {
        ...shopPolicy
      }
      refundPolicy {
        ...shopPolicy
      }
      shippingPolicy {
        ...shopPolicy
      }
      termsOfService {
        ...shopPolicy
      }
    }
  }
  ${shopPolicyFragment}
`;
