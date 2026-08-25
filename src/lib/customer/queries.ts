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
  query getCustomerOrders($first: Int = 25) {
    customer {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          name
          number
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice {
            amount
            currencyCode
          }
          subtotalPrice {
            amount
            currencyCode
          }
          totalTax {
            amount
            currencyCode
          }
          totalShippingPrice {
            amount
            currencyCode
          }
          lineItems(first: 25) {
            nodes {
              id
              title
              quantity
              price {
                amount
                currencyCode
              }
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
          shippingAddress {
            id
            address1
            address2
            city
            province
            zip
            country
            formatted
          }
        }
      }
    }
  }
`;
