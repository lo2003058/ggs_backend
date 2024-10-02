const Shopify = require('shopify-api-node');
require('dotenv/config');
const {logError} = require("../log");
const {PrismaClient} = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_COMPANY_ID = 1;
const CUSTOMERS_BATCH_SIZE = 250;

const shopify = new Shopify({
  shopName: process.env.SHOPIFY_HOST_NAME,
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
});

const fetchCustomers = async (first = 250) => {
  const query = `
    query ($first: Int!) {
      customers(first: $first) {
        edges {
          node {
            id
            email
            firstName
            lastName
            phone
            defaultAddress {
              address1
              address2
              city
              company
              country
              firstName
              id
              lastName
              phone
              province
              zip
            }
            createdAt
            updatedAt
          }
        }
      }
    }
  `;

  try {
    const variables = {first};
    const response = await shopify.graphql(query, variables);

    if (
      response &&
      response.customers &&
      Array.isArray(response.customers.edges)
    ) {
      return response.customers.edges.map(edge => edge.node);
    } else {
      console.error("Unexpected response structure:", response);
      throw new Error("Failed to retrieve customers");
    }
  } catch (error) {
    console.error("Error fetching customers from Shopify:", error);
    throw error;
  }
};

const fetchCustomerById = async (customerId) => {
  const query = `
    query {
      customer(id: "${customerId}") {
        id
        firstName
        lastName
        email
        phone
        createdAt
        updatedAt
        verifiedEmail
        validEmailAddress
        tags
        defaultAddress {
          address1
          address2
          city
          company
          country
          firstName
          id
          lastName
          phone
          province
          zip
        }
      }
    }
  `;

  try {
    const response = await shopify.graphql(query);

    if (response && response.customer) {
      return response.customer;
    } else {
      console.error("Unexpected response structure:", response);
      throw new Error("Failed to retrieve customer");
    }
  } catch (error) {
    console.error(`Error fetching customer with ID ${customerId} from Shopify:`, error);
    throw error;
  }
}

const createCustomerRecordInShopify = async (customer) => {
  const query = `
    mutation createCustomerMetafields($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
          phone
          defaultAddress {
            address1
            address2
            city
            company
            country
            firstName
            id
            lastName
            phone
            province
            zip
          }
        }
        userErrors {
          message
          field
        }
      }
    }
  `;
  let variables = {
    input: {
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
    }
  };
  if (customer.companyId) {
    const company = await prisma.company.findUnique({
      where: {id: customer.companyId},
    });

    variables.input.addresses = {
      address1: company.address1 || '',
      address2: company.address2 || '',
      city: company.city || '',
      company: company.name || '',
      country: company.country || '',
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      phone: company.phone || '',
      province: company.province || '',
      zip: company.zip || '',
    }
  }
  const response = await shopify.graphql(query, variables);
  if (response && response.customerCreate && response.customerCreate.customer) {
    return {
      id: response.customerCreate.customer.id.split('/').pop(),
      email: response.customerCreate.customer.email,
      firstName: response.customerCreate.customer.firstName,
      lastName: response.customerCreate.customer.lastName,
      phone: response.customerCreate.customer.phone,
    };
  } else {
    console.error("Unexpected response structure:", response);
    throw new Error("Failed to create customer");
  }

};

const updateCustomerRecordInShopify = async (customerId, customer) => {
  const query = `mutation updateCustomerMetafields($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
          phone
          defaultAddress {
            address1
            address2
            city
            company
            country
            firstName
            id
            lastName
            phone
            province
            zip
          }
        }
        userErrors {
          message
          field
        }
      }
    }`;
  let variables = {
    input: {
      id: customerId,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
    }
  };
  if (customer.companyId) {
    const company = await prisma.company.findUnique({
      where: {id: customer.companyId},
    });

    variables.input.addresses = {
      address1: company.address1 || '',
      address2: company.address2 || '',
      city: company.city || '',
      company: company.name || '',
      country: company.country || '',
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      phone: company.phone || '',
      province: company.province || '',
      zip: company.zip || '',
    }
  }

  const response = await shopify.graphql(query, variables);

  if (response && response.customerUpdate && response.customerUpdate.customer) {
    return {
      id: response.customerUpdate.customer.id.split('/').pop(),
      email: response.customerUpdate.customer.email,
      firstName: response.customerUpdate.customer.firstName,
      lastName: response.customerUpdate.customer.lastName,
      phone: response.customerUpdate.customer.phone,
    };
  } else {
    console.error("Unexpected response structure:", JSON.stringify(response));
    throw new Error("Failed to update customer");
  }

}

const deleteCustomerRecordInShopify = async (customerId) => {
  const query = `mutation customerDelete($id: ID!) {
      customerDelete(input: {id: $id}) {
        userErrors {
          field
          message
        }
        deletedCustomerId
      }
    }`;
  const variables = {id: customerId};
  const response = await shopify.graphql(query, variables);

  if (response && response.customerDelete && response.customerDelete.deletedCustomerId) {
    return response.customerDelete.deletedCustomerId;
  } else {
    console.error("Unexpected response structure:", response);
    throw new Error("Failed to delete customer");
  }
}

const findOrCreateCompany = async (address, email, phone) => {
  if (!address || !address.company) {
    return null;
  }

  const companyName = address.company;

  try {
    // Check if the company already exists
    let company = await prisma.company.findFirst({
      where: {name: companyName},
    });

    if (company) {
      return company;
    }

    // Create a new company if it doesn't exist
    company = await prisma.company.create({
      data: {
        name: companyName,
        address1: address.address1 || '',
        address2: address.address2 || '',
        city: address.city || '',
        country: address.country || '',
        province: address.province || '',
        zip: address.zip || '',
        email: email || '',
        phone: phone || '',
      },
    });

    return company;
  } catch (error) {
    console.error(`Error in findOrCreateCompany for ${companyName}:`, error);
    throw error;
  }
};

const createCustomerRecord = async (customer, companyId = DEFAULT_COMPANY_ID) => {
  try {
    await prisma.customer.create({
      data: {
        email: customer.email,
        first_name: customer.firstName || '',
        last_name: customer.lastName || '',
        full_name: `${customer.firstName || ''} ${customer.lastName || ''}`,
        phone: customer.phone || '',
        companyId: companyId,
        shopifyId: customer.id.split('/').pop(),
      },
    });
  } catch (error) {
    console.error(`Error creating customer ${customer.email}:`, error);
    throw error;
  }
};

const logSync = async (entityType, action, remarks) => {
  try {
    await prisma.shopifyDataSyncLog.create({
      data: {
        entityType,
        action,
        remarks,
      },
    });
    console.log(`Sync log created: ${entityType} - ${action}`);
  } catch (error) {
    console.error("Error logging synchronization:", error);
    throw error;
  }
};

const shopifyCustomerSync = async (req, res) => {
  try {
    const latestSyncLog = await prisma.shopifyDataSyncLog.findFirst({
      where: {entityType: 'customer', action: 'sync'},
      orderBy: {createdAt: 'desc'},
    });
    const lastSyncTime = latestSyncLog ? latestSyncLog.createdAt.toISOString() : null;

    let hasNextPage = true;
    let endCursor = null;
    let totalFetched = 0;
    const customersToProcess = [];

    while (hasNextPage) {
      const updatedAtFilter = lastSyncTime ? `updated_at:>'${lastSyncTime}'` : '';

      const query = `
        query ($first: Int!, $after: String) {
          customers(first: $first, after: $after, query: "${updatedAtFilter}") {
            edges {
              node {
                id
                email
                firstName
                lastName
                phone
                defaultAddress {
                  address1
                  address2
                  city
                  company
                  country
                  firstName
                  id
                  lastName
                  phone
                  province
                  zip
                }
                createdAt
                updatedAt
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const variables = {
        first: CUSTOMERS_BATCH_SIZE,
        after: endCursor,
      };

      const response = await shopify.graphql(query, variables);

      if (
        response &&
        response.customers &&
        Array.isArray(response.customers.edges)
      ) {
        const fetchedCustomers = response.customers.edges.map(edge => edge.node);
        customersToProcess.push(...fetchedCustomers);
        totalFetched += fetchedCustomers.length;

        hasNextPage = response.customers.pageInfo.hasNextPage;
        endCursor = response.customers.pageInfo.endCursor;
      } else {
        console.error("Unexpected response structure:", response);
        throw new Error("Failed to retrieve customers from Shopify.");
      }
    }

    if (customersToProcess.length === 0) {
      // No new or updated customers to sync
      await logSync("customer", "sync", "No new or updated customers to sync.");
      return res.status(200).send({message: "No new or updated customers to sync."});
    }

    for (const customer of customersToProcess) {
      try {
        const shopifyId = customer.id.split('/').pop();

        const existingCustomer = await prisma.customer.findFirst({
          where: {shopifyId: shopifyId},
        });

        if (existingCustomer) {
          let companyId = existingCustomer.companyId;

          if (customer.defaultAddress && customer.defaultAddress.company) {
            const company = await findOrCreateCompany(
              customer.defaultAddress,
              customer.email,
              customer.phone
            );
            if (company) {
              companyId = company.id;
            }
          }

          await prisma.customer.update({
            where: {shopifyId: shopifyId},
            data: {
              email: customer.email,
              first_name: customer.firstName || '',
              last_name: customer.lastName || '',
              full_name: `${customer.firstName || ''} ${customer.lastName || ''}`,
              phone: customer.phone || '',
              updatedAt: new Date(customer.updatedAt),
              companyId: companyId,
            },
          });
        } else {
          let companyId = DEFAULT_COMPANY_ID; // Assign to default company if no company info

          if (customer.defaultAddress && customer.defaultAddress.company) {
            const company = await findOrCreateCompany(
              customer.defaultAddress,
              customer.email,
              customer.phone
            );
            if (company) {
              companyId = company.id;
            }
          }

          await prisma.customer.create({
            data: {
              email: customer.email,
              first_name: customer.firstName || '',
              last_name: customer.lastName || '',
              full_name: `${customer.firstName || ''} ${customer.lastName || ''}`,
              phone: customer.phone || '',
              companyId: companyId,
              shopifyId: shopifyId,
              createdAt: new Date(customer.createdAt),
              updatedAt: new Date(customer.updatedAt),
            },
          });
        }
      } catch (customerError) {
        console.error(`Error syncing customer ID ${customer.id}:`, customerError);
        await logError({
          level: "ERROR",
          message: customerError.message,
          stackTrace: customerError.stack || '',
          endpoint: req.originalUrl,
          method: JSON.stringify(req.route.methods),
        });
      }
    }

    await logSync("customer", "sync", `Synced ${customersToProcess.length} customers.`);

    res.status(200).send({message: `Customers synced successfully. Count: ${customersToProcess.length}`});
  } catch (error) {
    console.error("Error in shopifyCustomerSync:", error);

    await logError({
      level: "ERROR",
      message: error.message,
      stackTrace: error.stack || '',
      endpoint: req.originalUrl,
      method: JSON.stringify(req.route.methods),
    });

    res.status(500).send("Customer synchronization failed.");
  }

};

const testShopify = async (req, res) => {
  try {
    const customers = await fetchCustomers(CUSTOMERS_BATCH_SIZE);

    if (customers.length === 0) {
      return res.status(200).send({message: "No customers to sync."});
    }

    for (const customer of customers) {
      let company = null;

      if (customer.defaultAddress) {
        company = await findOrCreateCompany(
          customer.defaultAddress,
          customer.email,
          customer.phone
        );
      }

      const companyId = company ? company.id : DEFAULT_COMPANY_ID;

      if (customer.email) {
        await createCustomerRecord(customer, companyId);
      } else {
        console.warn(`Customer with ID ${customer.id} has no email. Skipping.`);
      }
    }
    await logSync("customer", "sync", `Initial sync of ${customers.length} customers.`);

    res.status(200).send({message: "Customers synced successfully.", count: customers.length});

  } catch (error) {
    console.error("Error fetching and syncing customers:", error);

    await logError({
      level: "ERROR",
      message: error.message,
      stackTrace: error.stack || '',
      endpoint: req.originalUrl,
      method: JSON.stringify(req.route.methods),
    });

    res.status(500).send("Customer synchronization failed.");
  }
};

const testShopify2 = async (req, res) => {
  const rs = await fetchCustomerById("gid://shopify/Customer/7680786727144");
  res.send(rs);
}

const testShopify3 = async (req, res) => {
  const customers = await fetchCustomers(CUSTOMERS_BATCH_SIZE);
  res.send(customers);
}

module.exports = {
  shopifyCustomerSync,
  fetchCustomerById,
  createCustomerRecordInShopify,
  updateCustomerRecordInShopify,
  deleteCustomerRecordInShopify
};
