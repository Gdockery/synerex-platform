import {Inject, Injectable}              from '@angular/core';



@Injectable()
export class BaseTypeService {

  //Array of types.
  public types: Array<any> = [];

  //object property where the type of object is defined.
  protected typeKey = '';

  getTypes() {
    return this.types;
  }

  getType(id) {
    return this.types.find(type => {
      return type.id == id;
    });
  }

  updateCounts(typeList = []) {
    let typeCounts = typeList.reduce((acc, type) => {
      if(acc[type[this.typeKey]]) {
        acc[type[this.typeKey]]++;
      } else {
        acc[type[this.typeKey]] = 1;
      }
      return acc;
    }, {});

    this.types.forEach(type => {
      type.count = typeCounts[type.id] ? typeCounts[type.id] : 0;
    });
  }
}
