/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 7th November 2018 4:04:57 pm
 * @Email:  developer@xyfindables.com
 * @Filename: dependency-injection-container.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 15th November 2018 2:02:46 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */
import { XyoBase, XyoError, XyoErrors } from '@xyo-network/sdk-core-nodejs';
import configuration, { XyoArchivistConfig, IDependencyItemConfig } from '../configuration';

export class XyoDependencyInjectionContainer extends XyoBase {
  public dependencyRecipes: {[s: string]: IDependencyConfigItemContainer } = {};

  constructor (private readonly xyoConfig: XyoArchivistConfig) {
    super();
  }

  public async get<T>(name: string | { name: string}): Promise<T> {
    await this.initializeRecipes();
    const resolvedName = typeof name === 'string' ? name : name.name;

    const recipe = this.dependencyRecipes[resolvedName];

    if (!recipe) {
      throw new XyoError(`Could not find a recipe for ${resolvedName}`, XyoErrors.CRITICAL);
    }

    try {
      if (recipe.singletonValue) {
        return recipe.singletonValue as T;
      }

      let resolvedDependencies: any[] = [];
      if (recipe.dependsOn && recipe.dependsOn.length) {
        resolvedDependencies = await recipe.dependsOn.reduce(async (dependenciesPromise, dependencyName) => {
          const dependenciesCollection = await dependenciesPromise;
          const resolvedDependency = await this.get(dependencyName);
          dependenciesCollection.push(resolvedDependency);
          return dependenciesCollection;
        }, Promise.resolve([]) as Promise<any[]>);
      }

      let instance: T;
      if (recipe.type === 'resolved-export') {
        instance = recipe.resolvedExport as T;
      } else if (recipe.resolver && recipe.resolver === true) {
        const resolverFn = recipe.resolvedExport as IResolverFn;
        instance = (await resolverFn(this, configuration)) as T;
      } else {
        // tslint:disable-next-line:new-parens
        instance = new (
          Function.prototype.bind.apply(recipe.resolvedExport, [null, ...resolvedDependencies])
        ) as T;
      }

      if (recipe.type === 'singleton') {
        recipe.singletonValue = instance;
      }

      return instance;
    } catch (err) {
      this.logError(`An error occurred while trying to resolve dependency for ${resolvedName}`, err);
      throw err;
    }
  }

  private async initializeRecipes(): Promise<void> {
    if (Object.keys(this.dependencyRecipes).length > 0) {
      return;
    }

    await Object.keys(this.xyoConfig.dependencies).reduce(async (memo, depName) => {
      const aggregator = await memo;
      const dependencyItemConfig = this.xyoConfig.dependencies[depName];
      try {
        const pathToLoad = this.getPathToLoad(dependencyItemConfig.package);
        const resolvedPackage = await import(pathToLoad);
        const resolvedExport = resolvedPackage[dependencyItemConfig.export];
        if (!resolvedExport) {
          throw new XyoError(
            `Could not resolve export ${dependencyItemConfig.export} for package ${pathToLoad}`,
            XyoErrors.CRITICAL
          );
        }

        const entry = {
          resolvedExport,
          ...dependencyItemConfig
        };

        aggregator[depName] = entry;
        (dependencyItemConfig.aliases || []).forEach((alias) => {
          aggregator[alias] = entry;
        });

        return aggregator;
      } catch (err) {
        this.logError(`There was issue importing dependency ${depName} at ${depName}`, err);
        throw err;
      }
    }, Promise.resolve(this.dependencyRecipes));

    return;
  }

  private getPathToLoad(packagePath: string): string {
    if (packagePath && packagePath.length > 0 && packagePath.startsWith('./', 0)) {
      return `../${packagePath}`;
    }

    return packagePath;
  }
}

interface IDependencyConfigItemContainer extends IDependencyItemConfig {
  resolvedExport: any;
  singletonValue?: any;
}

type IResolverFn = (container: XyoDependencyInjectionContainer, config: XyoArchivistConfig) => Promise<any>;
