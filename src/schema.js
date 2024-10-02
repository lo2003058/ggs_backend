const {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');
const {PrismaClient} = require('@prisma/client');
const {
  createCustomerRecordInShopify,
  updateCustomerRecordInShopify,
  deleteCustomerRecordInShopify, fetchCustomerById
} = require("./shopify");
const prisma = new PrismaClient();

const CustomerType = new GraphQLObjectType({
  name: 'Customer',
  fields: () => ({
    id: {type: GraphQLInt},
    first_name: {type: GraphQLString},
    last_name: {type: GraphQLString},
    full_name: {type: GraphQLString},
    email: {type: GraphQLString},
    phone: {type: GraphQLString},
    shopifyId: {type: GraphQLString},
    shopifyData: {type: shopifyCustomerType},
    company: {
      type: CompanyType,
      resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }
        return prisma.company.findUnique({where: {id: parent.companyId}});
      },
    },
  }),
});

const shopifyCustomerType = new GraphQLObjectType({
  name: 'ShopifyCustomer',
  fields: () => ({
    id: {type: GraphQLString},
    firstName: {type: GraphQLString},
    lastName: {type: GraphQLString},
    email: {type: GraphQLString},
    phone: {type: GraphQLString},
    defaultAddress: {
      type: new GraphQLObjectType({
        name: 'ShopifyCustomerAddress',
        fields: () => ({
          id: {type: GraphQLString},
          firstName: {type: GraphQLString},
          lastName: {type: GraphQLString},
          address1: {type: GraphQLString},
          address2: {type: GraphQLString},
          city: {type: GraphQLString},
          company: {type: GraphQLString},
          province: {type: GraphQLString},
          zip: {type: GraphQLString},
          country: {type: GraphQLString},
        }),
      }),
    },
    createdAt: {type: GraphQLString},
    updatedAt: {type: GraphQLString},
  }),
});

const CreateCustomerInput = new GraphQLInputObjectType({
  name: 'CreateCustomerInput',
  fields: () => ({
    first_name: {type: new GraphQLNonNull(GraphQLString)},
    last_name: {type: new GraphQLNonNull(GraphQLString)},
    full_name: {type: GraphQLString},
    email: {type: new GraphQLNonNull(GraphQLString)},
    phone: {type: GraphQLString},
    shopifyId: {type: GraphQLString},
    companyId: {type: GraphQLInt},
  }),
});

const UpdateCustomerInput = new GraphQLInputObjectType({
  name: 'UpdateCustomerInput',
  fields: () => ({
    first_name: {type: new GraphQLNonNull(GraphQLString)},
    last_name: {type: new GraphQLNonNull(GraphQLString)},
    full_name: {type: GraphQLString},
    email: {type: GraphQLString},
    phone: {type: GraphQLString},
    shopifyId: {type: GraphQLString},
    companyId: {type: GraphQLInt},
  }),
});

const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: () => ({
    id: {type: GraphQLInt},
    name: {type: GraphQLString},
    email: {type: GraphQLString},
    phone: {type: GraphQLString},
    address1: {type: GraphQLString},
    address2: {type: GraphQLString},
    city: {type: GraphQLString},
    province: {type: GraphQLString},
    zip: {type: GraphQLString},
    country: {type: GraphQLString},
    customers: {
      type: new GraphQLList(CustomerType),
      resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }
        return prisma.customer.findMany({where: {companyId: parent.id}});
      },
    },
  }),
});

const CreateCompanyInput = new GraphQLInputObjectType({
  name: 'CreateCompanyInput',
  fields: () => ({
    name: {type: new GraphQLNonNull(GraphQLString)},
    email: {type: new GraphQLNonNull(GraphQLString)},
    phone: {type: GraphQLString},
    address1: {type: GraphQLString},
    address2: {type: GraphQLString},
    city: {type: GraphQLString},
    province: {type: GraphQLString},
    zip: {type: GraphQLString},
    country: {type: GraphQLString},
  }),
});

const UpdateCompanyInput = new GraphQLInputObjectType({
  name: 'UpdateCompanyInput',
  fields: () => ({
    name: {type: GraphQLString},
    email: {type: GraphQLString},
    phone: {type: GraphQLString},
    address1: {type: GraphQLString},
    address2: {type: GraphQLString},
    city: {type: GraphQLString},
    province: {type: GraphQLString},
    zip: {type: GraphQLString},
    country: {type: GraphQLString},
  }),
});

const PaginationArgs = {
  limit: {type: GraphQLInt},
  offset: {type: GraphQLInt},
  keyword: {type: GraphQLString}, // New argument for filtering
};

// Define RootQuery with Filtering
const RootQuery = new GraphQLObjectType({
  name: 'Query',
  fields: {
    customer: {
      type: CustomerType,
      args: {id: {type: GraphQLInt}},
      async resolve(parent, args) {
        let data = await prisma.customer.findUnique({where: {id: args.id}});
        if(data.shopifyId){
          data.shopifyData = await fetchCustomerById(`gid://shopify/Customer/${data.shopifyId}`);
        }
        return data;
      },
    },
    customers: {
      type: new GraphQLObjectType({
        name: 'CustomerPagination',
        fields: {
          items: {type: new GraphQLList(CustomerType)},
          totalCount: {type: GraphQLInt},
        },
      }),
      args: {
        ...PaginationArgs,
      },
      async resolve(parent, args, context) {
        // Authorization check
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        const {limit = 10, offset = 0, keyword = ''} = args;

        // Build filter criteria based on keyword
        const where = keyword
          ? {
            OR: [
              {first_name: {contains: keyword, mode: 'insensitive'}},
              {last_name: {contains: keyword, mode: 'insensitive'}},
              {full_name: {contains: keyword, mode: 'insensitive'}},
              {email: {contains: keyword, mode: 'insensitive'}},
              {phone: {contains: keyword, mode: 'insensitive'}},
              {shopifyId: {contains: keyword, mode: 'insensitive'}},
            ],
          }
          : {};

        // Fetch items and total count in parallel
        const [items, totalCount] = await Promise.all([
          prisma.customer.findMany({
            where,
            skip: offset,
            take: limit,
            include: {company: true}, // Include company data if needed
          }),
          prisma.customer.count({where}),
        ]);

        return {items, totalCount};
      },
    },

    company: {
      type: CompanyType,
      args: {id: {type: GraphQLInt}},
      resolve(parent, args) {
        return prisma.company.findUnique({where: {id: args.id}});
      },
    },
    companies: {
      type: new GraphQLObjectType({
        name: 'CompanyPagination',
        fields: {
          items: {type: new GraphQLList(CompanyType)},
          totalCount: {type: GraphQLInt},
        },
      }),
      args: {
        ...PaginationArgs,
      },
      async resolve(parent, args, context) {
        // Authorization check
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        const {limit = 10, offset = 0, keyword = ''} = args;

        // Build filter criteria based on keyword
        const where = keyword
          ? {
            OR: [
              {name: {contains: keyword, mode: 'insensitive'}},
              {email: {contains: keyword, mode: 'insensitive'}},
              {phone: {contains: keyword, mode: 'insensitive'}},
              {address1: {contains: keyword, mode: 'insensitive'}},
              {address2: {contains: keyword, mode: 'insensitive'}},
              {city: {contains: keyword, mode: 'insensitive'}},
              {province: {contains: keyword, mode: 'insensitive'}},
              {zip: {contains: keyword, mode: 'insensitive'}},
              {country: {contains: keyword, mode: 'insensitive'}},
            ],
          }
          : {};

        // Fetch items and total count in parallel
        const [items, totalCount] = await Promise.all([
          prisma.company.findMany({
            where,
            skip: offset,
            take: limit,
          }),
          prisma.company.count({where}),
        ]);

        return {items, totalCount};
      },

    },
  },
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createCustomer: {
      type: CustomerType,
      args: {
        input: {type: new GraphQLNonNull(CreateCustomerInput)}, // Ensure input is non-null
      },
      async resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }
        let {first_name, last_name, full_name, email, phone, shopifyId, companyId} = args.input;
        if (!shopifyId) {
          // create a new customer record in shopify
          const shopifyCustomer = await createCustomerRecordInShopify({
            email: email,
            first_name: first_name,
            last_name: last_name,
            phone: phone,
            companyId: companyId
          });
          shopifyId = shopifyCustomer.id;
        }
        return prisma.customer.create({
          data: {
            first_name,
            last_name,
            full_name,
            email,
            phone,
            shopifyId,
            companyId,
          },
        });
      },
    },
    updateCustomer: {
      type: CustomerType,
      args: {
        id: {type: new GraphQLNonNull(GraphQLInt)},
        input: {type: new GraphQLNonNull(UpdateCustomerInput)}, // Ensure input is non-null
      },
      async resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        const {id, input} = args;
        const {first_name, last_name, full_name, email, phone, shopifyId, companyId} = input;
        if (shopifyId) {
          // update customer record in shopify
          await updateCustomerRecordInShopify(`gid://shopify/Customer/${shopifyId}`, {
            email: email,
            first_name: first_name,
            last_name: last_name,
            phone: phone,
            companyId: companyId
          });
        }
        return prisma.customer.update({
          where: {id},
          data: input,
        });
      },
    },
    deleteCustomer: {
      type: CustomerType,
      args: {
        id: {type: new GraphQLNonNull(GraphQLInt)},
      },
      async resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }
        const {id} = args;
        const customer = await prisma.customer.findUnique({where: {id: parseInt(id)}});
        if (customer && customer.shopifyId) {
          // delete customer record in shopify
          await deleteCustomerRecordInShopify(`gid://shopify/Customer/${customer.shopifyId}`);
        }
        return prisma.customer.delete({
          where: {id},
        });
      },
    },

    createCompany: {
      type: CompanyType,
      args: {
        input: {type: new GraphQLNonNull(CreateCompanyInput)}, // Ensure input is non-null
      },
      resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        const {name, email, phone, address1, address2, city, province, zip, country} = args.input;
        return prisma.company.create({
          data: {
            name,
            email,
            phone,
            address1,
            address2,
            city,
            province,
            zip,
            country,
          },
        });
      },
    },
    updateCompany: {
      type: CompanyType,
      args: {
        id: {type: new GraphQLNonNull(GraphQLInt)},
        input: {type: new GraphQLNonNull(UpdateCompanyInput)}, // Ensure input is non-null
      },
      resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        const {id, input} = args;
        return prisma.company.update({
          where: {id},
          data: input,
        });
      },
    },
    deleteCompany: {
      type: CompanyType,
      args: {
        id: {type: new GraphQLNonNull(GraphQLInt)},
      },
      resolve: async (parent, args, context) => {
        if (!context.user) {
          throw new Error('Unauthorized');
        }

        const {id} = args;

        try {
          const company = await prisma.company.findUnique({
            where: {id},
            include: {customers: true},
          });

          if (!company) {
            throw new Error('Company not found.');
          }

          if (company.customers && company.customers.length > 0) {
            throw new Error('Cannot delete company with existing customers.');
          }

          return await prisma.company.delete({
            where: {id},
          });
        } catch (error) {
          // Optional: Log the error for debugging purposes
          console.error('Error deleting company:', error);
          throw new Error(error.message || 'An error occurred while deleting the company.');
        }
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});

