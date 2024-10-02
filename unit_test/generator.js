// for testing purpose only

const {PrismaClient} = require('@prisma/client');
const {faker} = require('@faker-js/faker');
const prisma = new PrismaClient();

// generate customer data
const generateCustomers = async (qty) => {
  for (let i = 0; i < qty; i++) {
    // random number 1-5
    const randomInt = Math.floor(Math.random() * 10) + 1;
    const randomName = faker.person.fullName();
    const randomEmail = faker.internet.email();
    const randomPhoneNumber = faker.phone.number({style: 'international'});

    await prisma.customer.create({
      data: {
        name: randomName,
        email: randomEmail,
        phone: randomPhoneNumber,
        companyId: randomInt
      }
    });
  }
  console.log("customer data generated");
}

const generateCompany = async (qty) => {
  for (let i = 0; i < qty; i++) {
    const randomEmail = faker.internet.email();
    const randomPhoneNumber = faker.phone.number({style: 'international'});
    const randomCompanyName = faker.company.name();
    const randomAddress = faker.location.streetAddress();
    const randomCounty = faker.location.county();
    const randomCity = faker.location.city();
    const randomState = faker.location.state();
    const randomZip = faker.location.zipCode();

    await prisma.company.create({
      data: {
        name: randomCompanyName,
        email: randomEmail,
        phone: randomPhoneNumber,
        address: randomAddress,
        city: randomCity,
        state: randomState,
        zip: randomZip,
        country: randomCounty
      }
    });
  }
  console.log("company data generated");
}

const initCompany = async () => {
  await prisma.company.create({
    data: {
      name: "Temp Company",
      email: "tc@tc.com",
      phone: "",
      address1: "",
      address2: "",
      city: "",
      province: "",
      zip: "",
      country: "Canada"
    }
  });
}

const main = async () => {
  // init create temp company data
  await initCompany();

  // await generateCompany(10);
  // await generateCustomers(20);
}

main();
