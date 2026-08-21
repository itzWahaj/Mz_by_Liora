import imageFragment from "./image";
import seoFragment from "./seo";

export const productFragment = /* GraphQl */ `
    fragment product on Product {
    id
    handle
    availableForSale
    title
    description
    descriptionHtml
    options {
      id
      name
      values
    }
    priceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 250) {
      edges {
        node {
          id
          title
          availableForSale
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
        }
      }
    }
    featuredImage {
      ...image
    }
    images(first: 20) {
      edges {
        node {
          ...image
        }
      }
    }
    seo {
      ...seo
    }
    tags
    updatedAt
    collections(first: 5) {
      edges {
        node {
          handle
          title
        }
      }
    }
    ratingMetafield: metafield(namespace: "reviews", key: "rating") {
      value
    }
    ratingCountMetafield: metafield(namespace: "reviews", key: "rating_count") {
      value
    }
    judgemeBadgeMetafield: metafield(namespace: "judgeme", key: "badge") {
      value
    }
    judgemeReviewsMetafield: metafield(namespace: "judgeme", key: "reviews") {
      value
    }
    judgemeWidgetMetafield: metafield(namespace: "judgeme", key: "widget") {
      value
    }
    judgemeWidgetDataMetafield: metafield(namespace: "judgeme", key: "review_widget_data") {
      value
    }
    }
    ${imageFragment}
    ${seoFragment}
`;
