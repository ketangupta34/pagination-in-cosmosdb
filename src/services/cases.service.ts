export default class CasesService {
  private cosmosDbHelper: any;

  constructor(cosmosDbHelper: any) {
    this.cosmosDbHelper = cosmosDbHelper;
  }

  /**
   * Get Case List function
   * @param contToken - continuation token to fetch the next entries
   * @param pageLimit - No of entries per query
   * @param sort - Sort the data in asc or desc based on a field
   * @param filter -Filter the entries based on a field and condition
   * @param search - search with the whole object
   * @param searchFields - search  a perticular value in a field
   * @param properties - Only return these properties in the result
   * @returns 
   */
  public async getCaseList(
    contToken: string = "",
    pageLimit: number = 2,
    sort: Array<{ field: string; order: any }> = [],
    filter: Array<{
      field: string;
      condition: any;
      value: string | number;
    }> = [],
    search: Array<string> = [],
    searchFields: Array<{ field: string; value: string }> = [],
    properties: Array<string> = []
  ): Promise<{
    result: Array<any>;
    hasMoreResults: boolean;
    continuationToken: string;
  }> {
    // First we fetch snippets of the sql based on properties
    const {
      allProperties,
      sorts,
      filters,
      searchObjectQuery,
      searchFieldQuery,
    } = this.cosmosDbHelper.getAllOptionsQuery(
      sort,
      filter,
      search,
      searchFields,
      properties
    );

    // Second we create the whole SQL using these snippets
    const sqlQuery =
      `SELECT ${allProperties} FROM backend WHERE backend.commonField = @commonField ${searchFieldQuery} ${searchObjectQuery} ${filters} ${sorts}`
    console.log({ sqlQuery })

    // Then we utilze this Sql query to fetch the data
    const { result, hasMoreResults, continuationToken } =
      await this.cosmosDbHelper.queryContainerNext(
        {
          query: sqlQuery,
          parameters: [{
            name: "@commonField",
            value: "commonField",
          },],
        },
        {
          maxItemCount: pageLimit,
          continuationToken: contToken
        },
        process.env.CONTAINER_NAME
      );

    return {
      result: result || [],
      hasMoreResults: hasMoreResults || false,
      continuationToken: continuationToken || "",
    };
  }
}
