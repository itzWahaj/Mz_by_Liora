export const getCustomerProfileQuery = /* GraphQL */ `
  query getCustomerProfile {
    customer {
      id
      firstName
      lastName
      displayName
      emailAddress {
        emailAddress
      }
      phoneNumber {
        phoneNumber
      }
      defaultAddress {
        id
        address1
        address2
        city
        province
        zip
        country
        firstName
        lastName
        phoneNumber
        formatted
      }
      addresses(first: 10) {
        nodes {
          id
          address1
          address2
          city
          province
          zip
          country
          firstName
          lastName
          phoneNumber
          formatted
        }
      }
    }
  }
`;

export const getCustomerOrdersQuery = /* GraphQL */ `
  query getCustomerOrders($first: Int = 20) {
    customer {
      orders(first: $first) {
        nodes {
          id
          name
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice {
            amount
            currencyCode
          }
          lineItems(first: 20) {
            nodes {
              id
              title
              quantity
              totalPrice {
                amount
                currencyCode
              }
              image {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

export const getCustomerWishlistQuery = /* GraphQL */ `
  query getCustomerWishlist {
    customer {
      id
      metafield(namespace: "custom", key: "wishlist") {
        id
        key
        namespace
        value
      }
    }
  }
`;

export const customerMetafieldsSetMutation = /* GraphQL */ `
  mutation customerMetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
        value
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;
