import {
  CosmosClient,
  Database,
  FeedOptions,
  SqlQuerySpec
} from "@azure/cosmos"

export class CosmosDbHelper {
  private client: CosmosClient
  private db: Database

  constructor() {
    const cosmosConfig = {
      endpoint: process.env.COSMOS_ENDPOINT,
      key: process.env.COSMOS_KEY,
    }
    this.client = new CosmosClient(cosmosConfig)
    this.db = this.client.database(process.env.COSMOS_DBNAME)
  }

  public async queryContainerNext(
    querySpec: SqlQuerySpec,
    queryOptions: FeedOptions,
    containerId: string
  ) {
    const container = this.db.container(containerId)
    const {
      resources: result,
      hasMoreResults,
      continuationToken,
    } = await container.items.query(querySpec, queryOptions).fetchNext()
    return { result, hasMoreResults, continuationToken }
  }

  /**
   * This searches the whole object with a string match
   */
  public getFullSearchSql = (searches: Array<string>): Array<string> => {
    const response = []

    searches.forEach((search) => {
      if (search) {
        response.push(`AND LOWER(ToString(backend)) LIKE "%${search.toLowerCase()}%"`)
      }
    })
    return response
  }

  public getFilterSql = (
    filters: Array<{
      field: string
      condition: any
      value: string | number | boolean
    }>
  ): Array<string> => {
    const response = []

    filters.forEach((filter, index) => {
      const replaced = filter.field.replace(".", " ")
      const first = replaced.split(" ")[0]
      const second = replaced.split(" ")[1]
      if (first === "documents" || first === "submissions") {
        response.push(
          `JOIN (SELECT VALUE t${index} FROM t${index} IN backend.${first} WHERE t${index}.${second} = '${filter.value}')`
        )
      } else if (filter.value === undefined) {
        response.push(
          `AND NOT IS_DEFINED(backend${this.objectToString(filter.field)})`
        )
      } else {
        response.push(
          `AND backend${this.objectToString(
            filter.field
          )} ${this.filterCondition(filter.condition)} ${typeof filter.value === "number" ||
            typeof filter.value === "boolean"
            ? `${filter.value}`
            : `'${filter.value}'`
          }`
        )
      }
    })
    return response
  }

  public objectToString(stringArr: String) {
    let result = ""
    stringArr.split(".").forEach((item) => {
      const str = item === "value" ? "[\"value\"]" : `.${item}`
      result += str
    })
    return result
  }

  public filterCondition(filterCondition: any) {
    let result
    switch (filterCondition) {
      case "equals":
        result = "="
        break
      case "greaterThan":
        result = ">"
        break
      case "smallerThan":
        result = "<"
        break
      default:
        break
    }
    return result
  }

  public getSort(sortArr: Array<{ field: string; order: any }>) {
    return sortArr.map((item, index) => {
      switch (item.order) {
        case "ASC":
          if (index === 0) {
            return `ORDER BY backend.${item.field} ASC`
          }
          return `backend.${item.field} ASC`

        case "DESC":
          if (index === 0) {
            return `ORDER BY backend.${item.field} DESC`
          }
          return `backend.${item.field} DESC`

        default:
          return ""
      }
    })
  }

  public getSearchQuery = (search: Array<{ field: string, value: string }>): string => {
    if (!search || search.length == 0) return ""

    let result: string = ""
    for (let i = 0; i < search.length; i++) {
      result += `AND LOWER(backend.${search[i].field}) LIKE '%${search[i].value.toLowerCase()}%' `
    }

    return result
  }

  /**
   * Get only these properties in result
   * @param properties Array with properties
   * @returns string
   */
  public getPropertiesQuery(properties: Array<string>): string {
    if (!properties || properties.length == 0) return "*"

    let result: string = ""
    for (let i = 0; i < properties.length; i++) {
      result += `backend.${properties[i]}, `
    }

    return result.substr(0, result.length - 2)
  }

  /**
   * Function to get all string connection for building complex sql Query
   * @param sort Array<{ field: string; order: SortOrder }>
   * @param filter Array<{ field: string; condition: FilterCondition; value: string | number; }>
   * @param search Array<string> (To search in the whole object)
   * @param searchFields Array<{ field: string, value: string }> (To search in a field in the object)
   * @param properties Array<string>
   * @returns { sorts, allProperties, filters, searchObjectQuery, searchFieldQuery }
   */
  public getAllOptionsQuery(
    sort: Array<{ field: string; order: any }>,
    filter: Array<{ field: string; condition: any; value: string | number; }>,
    search: Array<string>,
    searchFields: Array<{ field: string, value: string }>,
    properties: Array<string>) {
    const allProperties = this.getPropertiesQuery(properties)
    const sorts = this.getSort(sort).join(", ")
    const filters = this.getFilterSql(filter).filter((item) => item.includes("AND")).join(" ")
    const searchFieldQuery = this.getSearchQuery(searchFields)
    const searchObjectQuery = this.getFullSearchSql(search).join(" ")

    return { sorts, allProperties, filters, searchObjectQuery, searchFieldQuery }
  }
}
