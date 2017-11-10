import {DataEntryType} from '../../model';

export abstract class DataEntryTypeDefinition {
  constructor(readonly name: DataEntryType) {}

  abstract resolve(data: any): any;
  abstract merge(data: any, change: any): any;
}

export class ValueDataEntryTypeDefinition extends DataEntryTypeDefinition {
  constructor() {
    super('value');
  }

  resolve(data: any): any {
    return data;
  }

  merge(_data: any, update: any): any {
    return update;
  }
}

export interface AccumulationData {
  ids: any[];
  value: any;
}

export interface AccumulationUpdateData {
  id: any;
  value: any;
}

export class AccumulationDataEntryTypeDefinition extends DataEntryTypeDefinition {
  constructor() {
    super('accumulation');
  }

  resolve(data: AccumulationData | undefined): any {
    return data && data.value;
  }

  merge(
    data: AccumulationData | undefined,
    updates: AccumulationUpdateData[],
  ): AccumulationData {
    if (!data || !Array.isArray(data.ids)) {
      data = {
        ids: [],
        value: undefined,
      };
    }

    let idSet = new Set(data.ids);
    let currentValue = data.value;

    for (let {id, value} of updates) {
      if (idSet.has(id)) {
        continue;
      }

      currentValue = this.accumulate(currentValue, value);

      idSet.add(id);
    }

    return {
      ids: Array.from(idSet),
      value: currentValue,
    };
  }

  protected accumulate(a: any, b: any): any {
    return (a || (typeof b === 'string' ? '' : 0)) + b;
  }
}

export class DataEntryTypeManager {
  private map = new Map<DataEntryType, DataEntryTypeDefinition>();

  get(type: DataEntryType | undefined): DataEntryTypeDefinition | undefined {
    return this.map.get(type || ('value' as DataEntryType));
  }

  register(definition: DataEntryTypeDefinition): void {
    this.map.set(definition.name, definition);
  }

  static default = new DataEntryTypeManager();
}

DataEntryTypeManager.default.register(new ValueDataEntryTypeDefinition());
DataEntryTypeManager.default.register(
  new AccumulationDataEntryTypeDefinition(),
);
