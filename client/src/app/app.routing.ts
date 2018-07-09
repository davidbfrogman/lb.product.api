/*
 * Copyright (c) 2016 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { ModuleWithProviders } from '@angular/core/src/metadata/ng_module';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';


export const ApplicationRoutes: Routes = [
    // For testing this first line, you can have the base rout redirected to the component you're working on.
    //{path: '', redirectTo: 'reset-password', pathMatch: 'full'},
    {path: '', redirectTo: 'home', pathMatch: 'full'},
    {path: 'home', component: HomeComponent},
];

export const ApplicationRouting: ModuleWithProviders = RouterModule.forRoot(ApplicationRoutes);
