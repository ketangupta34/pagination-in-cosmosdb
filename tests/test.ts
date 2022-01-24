import dotenv from "dotenv"
import { CosmosDbHelper } from '../src/helper/cosmosdb.helper';
import CasesService from '../src/services/cases.service';

dotenv.config()

const cosmosDB = new CosmosDbHelper();
const casesRepo = new CasesService(cosmosDB);

describe.only('Testing Pagination In CosmosDB', () => {
  it('Test ISSUE - Sort result in desc order', async function () {
    this.timeout(10000)
    const result = await casesRepo.getCaseList("", 2, [{ field: "Number", order: "DESC" }], [], [], [], [])
    console.log({
      data: result.result,
      dataLength: result.result.length,
      hasMoreResult: result.hasMoreResults,
      contToken: result.continuationToken
    })
    console.log("If you see here has more result is there but continuation Token is not present. Due to this problem we cannot implement pagination with sorting")
  });
});


describe('Testing Pagination In CosmosDB (These Test WORKS)', () => {
  it('Test 1 - Empty Test (With no properties)', async function () {
    this.timeout(10000)
    const result = await casesRepo.getCaseList()
    console.log({
      data: result.result.length,
      hasMoreResult: result.hasMoreResults,
      contToken: result.continuationToken
    })
  });

  it('Test 2 - Search the whole object', async function () {
    this.timeout(10000)
    const result = await casesRepo.getCaseList("", 2, [], [], ["12"], [], [])
    console.log({
      data: result.result,
      dataLength: result.result.length,
      hasMoreResult: result.hasMoreResults,
      contToken: result.continuationToken
    })
  });

  it('Test 3 - Search the field with value', async function () {
    this.timeout(10000)
    const result = await casesRepo.getCaseList("", 2, [], [], [], [{ field: "Name", value: "Name 10" }], [])
    console.log({
      data: result.result,
      dataLength: result.result.length,
      hasMoreResult: result.hasMoreResults,
      contToken: result.continuationToken
    })
  });

  it('Test 4 - Get only selected properties', async function () {
    this.timeout(10000)
    const result = await casesRepo.getCaseList("", 2, [], [], [], [], ["Name"])
    console.log({
      data: result.result,
      dataLength: result.result.length,
      hasMoreResult: result.hasMoreResults,
      contToken: result.continuationToken
    })
  });

  it('Test 5 - Filter result on a condition', async function () {
    this.timeout(10000)
    const result = await casesRepo.getCaseList("", 2, [], [{ field: "Number", condition: "greaterThan", value: 10 }], [], [], [])
    console.log({
      data: result.result,
      dataLength: result.result.length,
      hasMoreResult: result.hasMoreResults,
      contToken: result.continuationToken
    })
  });

});


